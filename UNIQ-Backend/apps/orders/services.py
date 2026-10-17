import random
import string
from django.db import transaction, IntegrityError
from django.utils import timezone
from .models import Order, OrderEvent
from apps.catalog.models import ProductVariant

class OrderService:
    @staticmethod
    def generate_order_number():
        for _ in range(5):
            date_str = timezone.now().strftime('%Y%m%d')
            random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            num = f"UNQ-{date_str}-{random_str}"
            if not Order.objects.filter(order_number=num).exists():
                return num
        return f"UNQ-{timezone.now().strftime('%Y%m%d%H%M%S')}-{random.randint(1000, 9999)}"

    @staticmethod
    def transition_order_status(order, new_status, user=None, notes=''):
        with transaction.atomic():
            locked_order = Order.objects.select_for_update().get(id=order.id)
            if locked_order.status == new_status:
                return locked_order

            if not locked_order.can_transition_to(new_status):
                raise ValueError(f"Cannot transition order from status '{locked_order.status}' to '{new_status}'")

            if new_status == 'cancelled' and locked_order.payment_status == 'paid':
                raise ValueError(
                    "Cannot cancel an order whose payment has been captured. "
                    "Issue a refund instead."
                )

            prev_status = locked_order.status
            locked_order.status = new_status
            locked_order.save(update_fields=['status', 'updated_at'])

            if new_status == 'cancelled':
                for item in locked_order.items.select_related('variant').all():
                    if item.variant:
                        v = ProductVariant.objects.select_for_update().get(id=item.variant.id)
                        v.stock_quantity += item.quantity
                        v.save(update_fields=['stock_quantity', 'updated_at'])

            OrderEvent.objects.create(
                order=locked_order,
                previous_status=prev_status,
                new_status=new_status,
                triggered_by=user if user and user.is_authenticated else None,
                notes=notes
            )
        return locked_order

