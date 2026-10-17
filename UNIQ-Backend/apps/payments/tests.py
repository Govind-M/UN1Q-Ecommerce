from unittest.mock import patch
from django.test import TestCase, override_settings
from django.db import IntegrityError
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from razorpay.errors import SignatureVerificationError, ServerError, BadRequestError
from apps.catalog.models import Category, Product
from apps.orders.models import Order
from apps.payments.models import Payment, IdempotencyRecord
from apps.orders.services import OrderService

User = get_user_model()


@override_settings(DEBUG=True)
class RazorpayPaymentsModuleTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_a = User.objects.create_user(
            email='usera@uniq.com',
            password='Password123!',
            name='User A'
        )
        self.user_b = User.objects.create_user(
            email='userb@uniq.com',
            password='Password123!',
            name='User B'
        )
        self.category = Category.objects.create(
            slug='men_topwear',
            label='Topwear',
            gender='men'
        )
        self.product = Product.objects.create(
            name='Test Jacket',
            category=self.category,
            price=1499.00,
            status='active'
        )
        self.order_a = Order.objects.create(
            order_number='UNQ-USERA-001',
            user=self.user_a,
            customer_name='User A',
            customer_email='usera@uniq.com',
            status='pending',
            payment_status='pending',
            payment_method='razorpay',
            grand_total=1499.00,
            items_total=1499.00
        )
        self.order_b = Order.objects.create(
            order_number='UNQ-USERB-001',
            user=self.user_b,
            customer_name='User B',
            customer_email='userb@uniq.com',
            status='pending',
            payment_status='pending',
            payment_method='razorpay',
            grand_total=999.00,
            items_total=999.00
        )

    # 1. Another user's order is rejected (404)
    def test_another_user_order_rejected_404(self):
        self.client.force_authenticate(user=self.user_b)
        res_create = self.client.post('/api/v1/payments/create-order', {
            'order_id': str(self.order_a.id)
        }, format='json')
        self.assertEqual(res_create.status_code, status.HTTP_404_NOT_FOUND)

        self.order_a.razorpay_order_id = 'order_usera_123'
        self.order_a.save()
        Payment.objects.create(
            order=self.order_a,
            amount=self.order_a.grand_total,
            currency='INR',
            status='pending',
            razorpay_order_id='order_usera_123'
        )

        res_verify = self.client.post('/api/v1/payments/verify', {
            'razorpay_order_id': 'order_usera_123',
            'razorpay_payment_id': 'pay_123'
        }, format='json')
        self.assertEqual(res_verify.status_code, status.HTTP_404_NOT_FOUND)

    # 2. Mock mode is blocked when DEBUG=False
    @override_settings(DEBUG=False, RAZORPAY_KEY_ID='rzp_test_mock_123', RAZORPAY_KEY_SECRET='rzp_test_mock_456', RAZORPAY_WEBHOOK_SECRET='rzp_whsec_mock_789')
    def test_mock_mode_blocked_when_debug_false(self):
        self.client.force_authenticate(user=self.user_a)
        res_create = self.client.post('/api/v1/payments/create-order', {
            'order_id': str(self.order_a.id)
        }, format='json')
        self.assertEqual(res_create.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

        res_webhook = self.client.post('/api/v1/payments/webhook', {}, format='json')
        self.assertEqual(res_webhook.status_code, 500)

    # 3. Invalid signature is rejected
    @override_settings(DEBUG=False, RAZORPAY_KEY_ID='rzp_live_real_key', RAZORPAY_KEY_SECRET='rzp_live_real_secret', RAZORPAY_WEBHOOK_SECRET='rzp_whsec_real_secret')
    def test_invalid_signature_rejected(self):
        self.client.force_authenticate(user=self.user_a)
        self.order_a.razorpay_order_id = 'order_live_123'
        self.order_a.save()
        Payment.objects.create(
            order=self.order_a,
            amount=self.order_a.grand_total,
            currency='INR',
            status='pending',
            razorpay_order_id='order_live_123'
        )

        with patch('razorpay.Client') as mock_razorpay:
            mock_client = mock_razorpay.return_value
            mock_client.utility.verify_payment_signature.side_effect = SignatureVerificationError("Signature verification failed")
            
            res_verify = self.client.post('/api/v1/payments/verify', {
                'razorpay_order_id': 'order_live_123',
                'razorpay_payment_id': 'pay_live_123',
                'razorpay_signature': 'invalid_sig'
            }, format='json')
            self.assertEqual(res_verify.status_code, status.HTTP_400_BAD_REQUEST)

    # 4. Amount mismatch is rejected
    def test_amount_mismatch_rejected(self):
        rzp_order_id = f"order_mock_{self.order_a.id.hex[:12]}"
        self.order_a.razorpay_order_id = rzp_order_id
        self.order_a.save()

        Payment.objects.create(
            order=self.order_a,
            amount=self.order_a.grand_total,
            currency='INR',
            status='pending',
            razorpay_order_id=rzp_order_id
        )

        payload = {
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_tampered_123",
                        "order_id": rzp_order_id,
                        "amount": 50000,
                        "currency": "INR",
                        "status": "captured"
                    }
                }
            }
        }

        response = self.client.post('/api/v1/payments/webhook', payload, format='json')
        self.assertEqual(response.status_code, 200)

        self.order_a.refresh_from_db()
        self.assertNotEqual(self.order_a.payment_status, 'paid')
        self.assertNotEqual(self.order_a.status, 'confirmed')

        payment = Payment.objects.get(order=self.order_a)
        self.assertEqual(payment.status, 'failed')
        self.assertIn('mismatch', payment.error_message.lower())

    # 5. Duplicate webhook does not confirm twice
    def test_duplicate_webhook_does_not_confirm_twice(self):
        rzp_order_id = f"order_mock_{self.order_a.id.hex[:12]}"
        self.order_a.razorpay_order_id = rzp_order_id
        self.order_a.save()

        Payment.objects.create(
            order=self.order_a,
            amount=self.order_a.grand_total,
            currency='INR',
            status='pending',
            razorpay_order_id=rzp_order_id
        )

        payload = {
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_dup_123",
                        "order_id": rzp_order_id,
                        "amount": 149900,
                        "currency": "INR",
                        "status": "captured"
                    }
                }
            }
        }

        res1 = self.client.post('/api/v1/payments/webhook', payload, format='json')
        self.assertEqual(res1.status_code, 200)
        self.order_a.refresh_from_db()
        self.assertEqual(self.order_a.status, 'confirmed')

        with patch.object(OrderService, 'transition_order_status') as mock_transition:
            res2 = self.client.post('/api/v1/payments/webhook', payload, format='json')
            self.assertEqual(res2.status_code, 200)
            mock_transition.assert_not_called()

    # 6. Same Idempotency-Key from two different users does not share a response
    def test_same_idempotency_key_different_users(self):
        self.client.force_authenticate(user=self.user_a)
        res_a = self.client.post(
            '/api/v1/payments/create-order',
            {'order_id': str(self.order_a.id)},
            HTTP_IDEMPOTENCY_KEY='IDEM-KEY-999',
            format='json'
        )
        self.assertEqual(res_a.status_code, status.HTTP_200_OK)

        self.client.force_authenticate(user=self.user_b)
        res_b = self.client.post(
            '/api/v1/payments/create-order',
            {'order_id': str(self.order_b.id)},
            HTTP_IDEMPOTENCY_KEY='IDEM-KEY-999',
            format='json'
        )
        self.assertEqual(res_b.status_code, status.HTTP_200_OK)
        self.assertEqual(res_b.data['order_id'], str(self.order_b.id))
        self.assertNotEqual(res_b.data['order_id'], res_a.data['order_id'])

    # 7. Same key from the same user returns cached response
    def test_same_idempotency_key_same_user_returns_cached(self):
        self.client.force_authenticate(user=self.user_a)
        res1 = self.client.post(
            '/api/v1/payments/create-order',
            {'order_id': str(self.order_a.id)},
            HTTP_IDEMPOTENCY_KEY='IDEM-KEY-777',
            format='json'
        )
        self.assertEqual(res1.status_code, status.HTTP_200_OK)

        res2 = self.client.post(
            '/api/v1/payments/create-order',
            {'order_id': str(self.order_a.id)},
            HTTP_IDEMPOTENCY_KEY='IDEM-KEY-777',
            format='json'
        )
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(res2.data, res1.data)

    # 8. Reuse existing pending payment with same amount
    def test_reuse_existing_pending_payment(self):
        self.client.force_authenticate(user=self.user_a)
        self.order_a.razorpay_order_id = 'order_existing_999'
        self.order_a.save()
        Payment.objects.create(
            order=self.order_a,
            amount=self.order_a.grand_total,
            currency='INR',
            status='pending',
            razorpay_order_id='order_existing_999'
        )

        res = self.client.post('/api/v1/payments/create-order', {
            'order_id': str(self.order_a.id)
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['razorpay_order_id'], 'order_existing_999')
        self.assertEqual(Payment.objects.filter(order=self.order_a).count(), 1)

    # 9. Return 502 Bad Gateway when payment fetch fails
    @override_settings(DEBUG=False, RAZORPAY_KEY_ID='rzp_live_real_key', RAZORPAY_KEY_SECRET='rzp_live_real_secret', RAZORPAY_WEBHOOK_SECRET='rzp_whsec_real_secret')
    def test_verify_returns_502_on_gateway_error(self):
        self.client.force_authenticate(user=self.user_a)
        self.order_a.razorpay_order_id = 'order_live_fetch_fail'
        self.order_a.save()
        Payment.objects.create(
            order=self.order_a,
            amount=self.order_a.grand_total,
            currency='INR',
            status='pending',
            razorpay_order_id='order_live_fetch_fail'
        )

        with patch('razorpay.Client') as mock_razorpay:
            mock_client = mock_razorpay.return_value
            mock_client.utility.verify_payment_signature.return_value = True
            mock_client.payment.fetch.side_effect = ServerError("Gateway down")

            res_verify = self.client.post('/api/v1/payments/verify', {
                'razorpay_order_id': 'order_live_fetch_fail',
                'razorpay_payment_id': 'pay_live_fetch_fail',
                'razorpay_signature': 'valid_sig'
            }, format='json')

            self.assertEqual(res_verify.status_code, status.HTTP_502_BAD_GATEWAY)

    # 10. Reject creating payment (400) if order is already paid or non-pending
    def test_create_order_rejected_if_already_paid_or_not_pending(self):
        self.client.force_authenticate(user=self.user_a)
        self.order_a.payment_status = 'paid'
        self.order_a.save()

        res_paid = self.client.post('/api/v1/payments/create-order', {
            'order_id': str(self.order_a.id)
        }, format='json')
        self.assertEqual(res_paid.status_code, status.HTTP_400_BAD_REQUEST)

    # 11. Idempotency key reuse with different order_id returns 409 Conflict
    def test_idempotency_key_reuse_different_order_id_returns_409(self):
        self.client.force_authenticate(user=self.user_a)
        res1 = self.client.post(
            '/api/v1/payments/create-order',
            {'order_id': str(self.order_a.id)},
            HTTP_IDEMPOTENCY_KEY='IDEM-KEY-CONFLICT',
            format='json'
        )
        self.assertEqual(res1.status_code, status.HTTP_200_OK)

        order_a2 = Order.objects.create(
            order_number='UNQ-USERA-002',
            user=self.user_a,
            status='pending',
            payment_status='pending',
            grand_total=500.00
        )

        res2 = self.client.post(
            '/api/v1/payments/create-order',
            {'order_id': str(order_a2.id)},
            HTTP_IDEMPOTENCY_KEY='IDEM-KEY-CONFLICT',
            format='json'
        )
        self.assertEqual(res2.status_code, status.HTTP_409_CONFLICT)

    # 12. Create returns 502 for Razorpay error and 500 for unexpected error
    @override_settings(DEBUG=False, RAZORPAY_KEY_ID='rzp_live_real_key', RAZORPAY_KEY_SECRET='rzp_live_real_secret', RAZORPAY_WEBHOOK_SECRET='rzp_whsec_real_secret')
    def test_create_returns_502_on_razorpay_error(self):
        self.client.force_authenticate(user=self.user_a)
        with patch('razorpay.Client') as mock_razorpay:
            mock_client = mock_razorpay.return_value
            mock_client.order.create.side_effect = ServerError("Gateway error")

            res = self.client.post('/api/v1/payments/create-order', {
                'order_id': str(self.order_a.id)
            }, format='json')
            self.assertEqual(res.status_code, status.HTTP_502_BAD_GATEWAY)

    # 13. Never change Payment from 'succeeded' to 'failed'
    def test_never_change_succeeded_payment_to_failed(self):
        rzp_order_id = f"order_mock_{self.order_a.id.hex[:12]}"
        self.order_a.razorpay_order_id = rzp_order_id
        self.order_a.save()

        payment = Payment.objects.create(
            order=self.order_a,
            amount=self.order_a.grand_total,
            currency='INR',
            status='succeeded',
            razorpay_order_id=rzp_order_id
        )

        payload = {
            "event": "payment.failed",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_failed_123",
                        "order_id": rzp_order_id,
                        "error_description": "Late failure"
                    }
                }
            }
        }
        res = self.client.post('/api/v1/payments/webhook', payload, format='json')
        self.assertEqual(res.status_code, 200)

        payment.refresh_from_db()
        self.assertEqual(payment.status, 'succeeded')
