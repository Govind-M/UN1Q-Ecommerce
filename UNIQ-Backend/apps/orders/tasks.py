from datetime import timedelta

from celery import shared_task
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.utils import timezone
from .models import Order

@shared_task(acks_late=True, max_retries=3, default_retry_delay=60)
def send_order_confirmation_email(order_id):
    try:
        order = Order.objects.prefetch_related('items__product').get(id=order_id)
        recipient = order.customer_email or (order.user.email if order.user else None)
        if not recipient:
            return f"Order #{order.order_number}: Skipped (No recipient email found)."

        subject = f"Order Confirmed: #{order.order_number} | UN1Q E-Commerce"
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'UN1Q Store <noreply@uniq.com>')

        text_content = (
            f"Hi {order.customer_name or 'Valued Customer'},\n\n"
            f"Thank you for shopping with UN1Q! Your order #{order.order_number} has been confirmed.\n"
            f"Grand Total: Rs.{order.grand_total}\n"
            f"Status: {order.status}\n\n"
            f"We are packing your items and will notify you when your package ships.\n\n"
            f"Best regards,\nUN1Q Team"
        )

        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #0f172a; padding: 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px;">UN1Q</h1>
                <p style="color: #94a3b8; margin: 4px 0 0; font-size: 12px; letter-spacing: 1px;">ORDER CONFIRMATION</p>
            </div>
            <div style="padding: 24px; color: #334155;">
                <h2 style="color: #0f172a; margin-top: 0;">Thank You for Your Order!</h2>
                <p>Hi <b>{order.customer_name or 'Customer'}</b>,</p>
                <p>We've received your order <b>#{order.order_number}</b> and our warehouse is preparing it for shipment.</p>

                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
                    <p style="margin: 0 0 6px;"><b>Order Number:</b> #{order.order_number}</p>
                    <p style="margin: 0 0 6px;"><b>Total Paid:</b> ₹{order.grand_total} (INR)</p>
                    <p style="margin: 0;"><b>Payment Status:</b> {order.payment_status.upper()}</p>
                </div>

                <p style="font-size: 13px; color: #64748b;">If you have any questions, simply reply directly to this email.</p>
            </div>
            <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #64748b;">
                © 2026 UN1Q E-Commerce Platform. All rights reserved.
            </div>
        </div>
        """

        msg = EmailMultiAlternatives(subject, text_content, from_email, [recipient])
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)

        return f"Order confirmation email successfully sent to {recipient}"

    except Exception as exc:
        raise send_order_confirmation_email.retry(exc=exc, countdown=60)

def gateway_confirms_paid(order):
    if not order.razorpay_order_id:
        return False

    if settings.DEBUG and getattr(settings, 'RAZORPAY_MOCK_MODE', False):
        return False

    key_id = getattr(settings, 'RAZORPAY_KEY_ID', '')
    key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', '')
    if not key_id or not key_secret:
        return None

    try:
        import razorpay

        client = razorpay.Client(auth=(key_id, key_secret))
        remote = client.order.fetch(order.razorpay_order_id)

        if (remote.get('status') or '').lower() == 'paid':
            return True

        try:
            amount_paid = float(remote.get('amount_paid') or 0)
        except (TypeError, ValueError):
            amount_paid = 0.0

        return amount_paid > 0

    except Exception:
        return None

@shared_task(name='apps.orders.tasks.cancel_expired_pending_orders')
def cancel_expired_pending_orders():
    from .services import OrderService
    from apps.payments.models import Payment

    window = int(getattr(settings, 'ORDER_PAYMENT_WINDOW_MINUTES', 30) or 30)
    cutoff = timezone.now() - timedelta(minutes=window)

    stale_ids = list(
        Order.objects
        .filter(status='pending', payment_status='pending', created_at__lte=cutoff)
        .values_list('id', flat=True)
    )

    cancelled = 0
    rescued = 0
    skipped = 0

    for order_id in stale_ids:
        try:
            order = Order.objects.get(id=order_id)

            paid = gateway_confirms_paid(order)

            if paid is None:
                skipped += 1
                continue

            if paid:
                order.payment_status = 'paid'
                order.save(update_fields=['payment_status', 'updated_at'])

                Payment.objects.filter(order=order, status='pending').update(
                    status='succeeded'
                )

                OrderService.transition_order_status(
                    order=order,
                    new_status='confirmed',
                    notes='Confirmed by gateway reconciliation (no webhook configured)',
                )
                send_order_confirmation_email.delay(str(order.id))
                rescued += 1
                continue

            OrderService.transition_order_status(
                order=order,
                new_status='cancelled',
                notes=f'Auto-cancelled: gateway confirms unpaid after {window} minutes',
            )
            cancelled += 1

        except (Order.DoesNotExist, ValueError):
            continue

    return (
        f'Cancelled {cancelled}, rescued {rescued}, '
        f'skipped {skipped} (gateway unreachable).'
    )