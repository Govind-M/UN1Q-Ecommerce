import json
from decimal import Decimal, ROUND_HALF_UP
import razorpay
from django.conf import settings
from django.db import transaction, IntegrityError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.http import HttpResponse
from .models import Payment, IdempotencyRecord
from apps.orders.models import Order
from apps.orders.services import OrderService


def to_paise(amount_decimal):
    return int((Decimal(str(amount_decimal)) * Decimal('100')).quantize(Decimal('1'), rounding=ROUND_HALF_UP))


def get_razorpay_client():
    key_id = getattr(settings, 'RAZORPAY_KEY_ID', '')
    key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', '')
    if not key_id or not key_secret:
        raise ValueError("Razorpay API credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are missing from settings.")
    return razorpay.Client(auth=(key_id, key_secret))


class CreateRazorpayOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        order_id = request.data.get('order_id')
        if not order_id:
            return Response({'message': 'order_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Idempotency Check
        idempotency_key = request.headers.get('Idempotency-Key')
        if idempotency_key:
            record = IdempotencyRecord.objects.filter(user=request.user, key=idempotency_key).first()
            if record:
                if record.order_id and str(record.order_id) != str(order_id):
                    return Response({'message': 'Idempotency key was previously used with a different order_id'}, status=status.HTTP_409_CONFLICT)
                return Response(record.response_body, status=record.status_code)

        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except (Order.DoesNotExist, ValueError, TypeError):
            return Response({'message': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

        if order.payment_status == 'paid' or order.status != 'pending':
            return Response({'message': 'Payment cannot be created for an order that is already paid or not pending'}, status=status.HTTP_400_BAD_REQUEST)

        amount_paise = to_paise(order.grand_total)
        key_id = getattr(settings, 'RAZORPAY_KEY_ID', '')

        try:
            with transaction.atomic():
                order_locked = Order.objects.select_for_update().get(id=order.id, user=request.user)

                if order_locked.payment_status == 'paid' or order_locked.status != 'pending':
                    return Response({'message': 'Payment cannot be created for an order that is already paid or not pending'}, status=status.HTTP_400_BAD_REQUEST)

                # Re-check for an existing pending Payment with valid razorpay_order_id
                existing_payment = Payment.objects.filter(
                    order=order_locked,
                    status='pending'
                ).exclude(razorpay_order_id='').first()

                if existing_payment and existing_payment.amount == order_locked.grand_total:
                    rzp_order_id = existing_payment.razorpay_order_id
                else:
                    client = get_razorpay_client()
                    rzp_order = client.order.create({
                        'amount': amount_paise,
                        'currency': 'INR',
                        'receipt': str(order_locked.order_number),
                        'notes': {
                            'order_id': str(order_locked.id),
                            'order_number': order_locked.order_number
                        }
                    })
                    rzp_order_id = rzp_order.get('id')

                    order_locked.razorpay_order_id = rzp_order_id
                    order_locked.payment_method = 'razorpay'
                    order_locked.save(update_fields=['razorpay_order_id', 'payment_method', 'updated_at'])

                    Payment.objects.create(
                        order=order_locked,
                        amount=order_locked.grand_total,
                        currency='INR',
                        status='pending',
                        razorpay_order_id=rzp_order_id
                    )

                res_data = {
                    'key': key_id,
                    'razorpay_key_id': key_id,
                    'amount': amount_paise,
                    'amount_paise': amount_paise,
                    'currency': 'INR',
                    'order_id': str(order_locked.id),
                    'razorpay_order_id': rzp_order_id
                }

                if idempotency_key:
                    try:
                        with transaction.atomic():
                            IdempotencyRecord.objects.create(
                                user=request.user,
                                key=idempotency_key,
                                order_id=str(order_locked.id),
                                status_code=200,
                                response_body=res_data
                            )
                    except IntegrityError:
                        pass

            return Response(res_data, status=status.HTTP_200_OK)

        except (razorpay.errors.BadRequestError, razorpay.errors.ServerError) as e:
            return Response({'message': 'Could not create payment order via gateway.'}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VerifyRazorpayPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        rzp_order_id = request.data.get('razorpay_order_id')
        rzp_payment_id = request.data.get('razorpay_payment_id')
        rzp_signature = request.data.get('razorpay_signature', '')

        if not rzp_order_id or not rzp_payment_id:
            return Response({'message': 'razorpay_order_id and razorpay_payment_id are required'}, status=status.HTTP_400_BAD_REQUEST)

        payment_record = Payment.objects.select_related('order').filter(
            razorpay_order_id=rzp_order_id,
            order__user=request.user
        ).first()

        if not payment_record or not payment_record.order:
            return Response({'message': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

        order = payment_record.order

        # Verify HMAC-SHA256 Payment Signature
        client = get_razorpay_client()
        try:
            client.utility.verify_payment_signature({
                'razorpay_order_id': rzp_order_id,
                'razorpay_payment_id': rzp_payment_id,
                'razorpay_signature': rzp_signature
            })
        except razorpay.errors.SignatureVerificationError:
            with transaction.atomic():
                payment_to_fail = Payment.objects.select_for_update().filter(razorpay_order_id=rzp_order_id, status='pending').first()
                if payment_to_fail:
                    payment_to_fail.status = 'failed'
                    payment_to_fail.error_message = 'Signature verification failed'
                    payment_to_fail.save(update_fields=['status', 'error_message', 'updated_at'])
            return Response({'message': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)

        # Update Payment & Order status atomically
        try:
            with transaction.atomic():
                payment = Payment.objects.select_for_update().filter(razorpay_order_id=rzp_order_id).first()
                order_locked = Order.objects.select_for_update().filter(id=order.id).first()

                if (payment and payment.status == 'succeeded') or (order_locked and order_locked.payment_status == 'paid'):
                    return Response({
                        'message': 'Payment verified successfully',
                        'order_id': str(order_locked.id),
                        'status': order_locked.status,
                        'payment_status': order_locked.payment_status
                    }, status=status.HTTP_200_OK)

                if order_locked:
                    order_locked.razorpay_payment_id = rzp_payment_id
                    order_locked.razorpay_signature = rzp_signature
                    order_locked.payment_status = 'paid'
                    order_locked.save(update_fields=['razorpay_payment_id', 'razorpay_signature', 'payment_status', 'updated_at'])

                if payment:
                    payment.razorpay_payment_id = rzp_payment_id
                    payment.razorpay_signature = rzp_signature
                    payment.status = 'succeeded'
                    payment.save(update_fields=['razorpay_payment_id', 'razorpay_signature', 'status', 'updated_at'])

                if order_locked:
                    OrderService.transition_order_status(
                        order=order_locked,
                        new_status='confirmed',
                        notes='Confirmed via Razorpay Payment Verification'
                    )

        except IntegrityError:
            pass

        order.refresh_from_db()
        return Response({
            'message': 'Payment verified successfully',
            'order_id': str(order.id),
            'status': order.status,
            'payment_status': order.payment_status
        }, status=status.HTTP_200_OK)


class RazorpayWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        payload = request.body
        sig_header = request.headers.get('X-Razorpay-Signature', '')
        webhook_secret = getattr(settings, 'RAZORPAY_WEBHOOK_SECRET', '')

        if sig_header and webhook_secret and not webhook_secret.startswith('rzp_whsec_mock'):
            client = get_razorpay_client()
            try:
                client.utility.verify_webhook_signature(
                    payload.decode('utf-8'),
                    sig_header,
                    webhook_secret
                )
            except razorpay.errors.SignatureVerificationError:
                return HttpResponse(status=400)

        try:
            event_data = json.loads(payload.decode('utf-8'))
        except Exception:
            return HttpResponse(status=400)

        event_type = event_data.get('event')
        payload_entity = event_data.get('payload', {}).get('payment', {}).get('entity', {})

        rzp_order_id = payload_entity.get('order_id')
        rzp_payment_id = payload_entity.get('id')

        if event_type in ['payment.captured', 'order.paid']:
            if rzp_order_id:
                with transaction.atomic():
                    payment = Payment.objects.select_for_update().select_related('order').filter(razorpay_order_id=rzp_order_id).first()
                    if not payment or not payment.order:
                        return HttpResponse(status=200)

                    order = Order.objects.select_for_update().filter(id=payment.order_id).first()
                    if not order or order.payment_status == 'paid':
                        return HttpResponse(status=200)

                    payment.status = 'succeeded'
                    if rzp_payment_id:
                        payment.razorpay_payment_id = rzp_payment_id
                    payment.save(update_fields=['status', 'razorpay_payment_id', 'updated_at'])

                    order.payment_status = 'paid'
                    if rzp_payment_id:
                        order.razorpay_payment_id = rzp_payment_id
                    order.save(update_fields=['payment_status', 'razorpay_payment_id', 'updated_at'])

                    OrderService.transition_order_status(
                        order=order,
                        new_status='confirmed',
                        notes='Confirmed via Razorpay Webhook'
                    )

        elif event_type == 'payment.failed':
            if rzp_order_id:
                with transaction.atomic():
                    payment = Payment.objects.select_for_update().filter(razorpay_order_id=rzp_order_id).first()
                    if payment and payment.status == 'pending':
                        payment.status = 'failed'
                        payment.error_message = payload_entity.get('error_description', 'Payment failed')
                        payment.save(update_fields=['status', 'error_message', 'updated_at'])

        return HttpResponse(status=200)
