from datetime import timedelta

from celery import shared_task
from django.db import transaction
from django.utils import timezone

from .models import Cart
from .services import StockReservationService

GUEST_CART_RETENTION_DAYS = 30

@shared_task(name='apps.cart.tasks.cleanup_expired_stock_reservations')
def cleanup_expired_stock_reservations():
    released = StockReservationService.release_expired_reservations()
    return f"Released {released} expired stock reservation(s)."

@shared_task(name='apps.cart.tasks.reconcile_stock_reservations')
def reconcile_stock_reservations():
    corrected = StockReservationService.reconcile_reserved_quantities()
    return f"Reconciled reserved_quantity on {corrected} variant(s)."

@shared_task(name='apps.cart.tasks.purge_stale_guest_carts')
def purge_stale_guest_carts():
    cutoff = timezone.now() - timedelta(days=GUEST_CART_RETENTION_DAYS)
    stale_ids = list(
        Cart.objects.filter(user=None, updated_at__lt=cutoff).values_list('id', flat=True)
    )

    purged = 0
    for cart_id in stale_ids:
        try:
            with transaction.atomic():
                cart = Cart.objects.select_for_update().filter(id=cart_id, user=None).first()
                if not cart:
                    continue
                for item in cart.items.all():
                    StockReservationService.sync(cart, item.variant, 0)
                cart.hard_delete()
                purged += 1
        except Exception:
            continue

    return f"Purged {purged} stale guest cart(s) older than {GUEST_CART_RETENTION_DAYS} days."