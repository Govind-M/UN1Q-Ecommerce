from decimal import Decimal, ROUND_HALF_UP
from datetime import timedelta

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from apps.catalog.models import ProductVariant
from .models import Cart, CartItem, StockReservation

class InsufficientStock(Exception):

    def __init__(self, sku, requested, available):
        self.sku = sku
        self.requested = requested
        self.available = available
        super().__init__(
            f"Insufficient stock for variant {sku}. Requested: {requested}, Available: {available}"
        )

class PricingService:
    @staticmethod
    def calculate_item_unit_price(product, variant=None):
        if variant and variant.price_override is not None:
            base_price = Decimal(str(variant.price_override))
        else:
            base_price = Decimal(str(product.price))

        unit_price = base_price
        if product.discount:
            try:
                disc_str = str(product.discount).replace('%', '').strip()
                disc_pct = Decimal(disc_str)
                discount_amount = base_price * (disc_pct / Decimal('100'))
                unit_price = max(Decimal('0.00'), base_price - discount_amount)
            except Exception:
                unit_price = base_price

        return unit_price.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    @staticmethod
    def calculate_item_total_price(product, variant=None, quantity=1):
        unit_price = PricingService.calculate_item_unit_price(product, variant)
        total = unit_price * Decimal(str(quantity))

        if product.offer and isinstance(product.offer, str):
            offer_str = product.offer.lower().strip()
            if 'buy' in offer_str and 'for' in offer_str:
                try:
                    parts = offer_str.split('for')
                    req_qty = int(parts[0].replace('buy', '').strip())
                    bundle_price = Decimal(parts[1].strip())

                    if req_qty > 0 and quantity >= req_qty:
                        bundles = quantity // req_qty
                        remainder = quantity % req_qty
                        total = (bundle_price * Decimal(str(bundles))) + (unit_price * Decimal(str(remainder)))
                except Exception:
                    pass

        return total.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

class CouponError(Exception):
    pass

class CouponService:

    @staticmethod
    def evaluate(code, subtotal, now=None):
        from .models import Coupon

        subtotal = Decimal(str(subtotal))
        if subtotal <= Decimal('0.00'):
            raise CouponError('Cart subtotal must be greater than zero.')

        coupon = Coupon.objects.filter(code__iexact=str(code).strip()).first()
        if not coupon:
            raise CouponError('Invalid coupon code.')
        if not coupon.is_active:
            raise CouponError('Coupon is inactive.')

        now = now or timezone.now()
        if coupon.expires_at and coupon.expires_at < now:
            raise CouponError('Coupon has expired.')

        min_value = Decimal(str(coupon.min_order_value))
        if subtotal < min_value:
            raise CouponError(
                f'Minimum order value for code {coupon.code} is Rs.{min_value}'
            )

        discount_value = Decimal(str(coupon.discount_value))
        if coupon.discount_type == 'percentage':
            discount = (subtotal * discount_value) / Decimal('100')
            if coupon.max_discount_amount:
                discount = min(discount, Decimal(str(coupon.max_discount_amount)))
        else:
            discount = min(discount_value, subtotal)

        discount = discount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        return min(discount, subtotal), coupon

class ShippingService:

    @staticmethod
    def compute(subtotal):
        from django.conf import settings

        subtotal = Decimal(str(subtotal))
        flat_fee = Decimal(str(getattr(settings, 'SHIPPING_FLAT_FEE', '0') or '0'))
        threshold = Decimal(str(getattr(settings, 'FREE_SHIPPING_THRESHOLD', '0') or '0'))

        if subtotal <= Decimal('0.00'):
            return Decimal('0.00')
        if threshold > Decimal('0.00') and subtotal >= threshold:
            return Decimal('0.00')
        return flat_fee.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

class StockReservationService:

    RESERVATION_TTL_MINUTES = 30

    @staticmethod
    def _held_quantity(cart, variant):
        if cart is None or variant is None:
            return 0
        return (
            StockReservation.objects
            .filter(cart=cart, product_variant=variant)
            .aggregate(total=Sum('quantity'))['total'] or 0
        )

    @staticmethod
    def _consume_oldest_first(cart, variant, amount):
        remaining = amount
        rows = (
            StockReservation.objects
            .filter(cart=cart, product_variant=variant)
            .order_by('created_at')
        )
        for res in rows:
            if remaining <= 0:
                break
            take = min(res.quantity, remaining)
            remaining -= take
            new_qty = res.quantity - take
            if new_qty <= 0:
                res.hard_delete()
            else:
                res.quantity = new_qty
                res.save(update_fields=['quantity', 'updated_at'])

    @staticmethod
    def sync(cart, variant, desired_qty, ttl_minutes=None):
        if cart is None or variant is None:
            return 0

        ttl = int(ttl_minutes or StockReservationService.RESERVATION_TTL_MINUTES)
        desired_qty = max(0, int(desired_qty))

        with transaction.atomic():
            locked = ProductVariant.objects.select_for_update().get(id=variant.id)

            held = StockReservationService._held_quantity(cart, locked)
            delta = desired_qty - held

            if delta == 0:
                StockReservation.objects.filter(cart=cart, product_variant=locked).update(
                    expires_at=timezone.now() + timedelta(minutes=ttl)
                )
                return 0

            if delta > 0:
                available = locked.stock_quantity - locked.reserved_quantity
                if available < delta:
                    raise InsufficientStock(locked.sku, delta, available)

                StockReservation.objects.create(
                    cart=cart,
                    product_variant=locked,
                    user=cart.user,
                    quantity=delta,
                    expires_at=timezone.now() + timedelta(minutes=ttl),
                )
            else:
                StockReservationService._consume_oldest_first(cart, locked, -delta)

            locked.reserved_quantity = max(0, locked.reserved_quantity + delta)
            locked.save(update_fields=['reserved_quantity', 'updated_at'])

        return delta

    @staticmethod
    def release_expired_reservations():
        now = timezone.now()
        expired = list(
            StockReservation.objects
            .filter(expires_at__lte=now)
            .values_list('id', 'product_variant_id', 'quantity')
        )

        count = 0
        for res_id, variant_id, quantity in expired:
            with transaction.atomic():
                variant = (
                    ProductVariant.objects
                    .select_for_update()
                    .filter(id=variant_id)
                    .first()
                )
                if variant:
                    variant.reserved_quantity = max(0, variant.reserved_quantity - quantity)
                    variant.save(update_fields=['reserved_quantity', 'updated_at'])
                StockReservation.all_objects.filter(id=res_id).delete()
                count += 1
        return count

    @staticmethod
    def reconcile_reserved_quantities():
        expected = {
            row['product_variant_id']: row['total']
            for row in (
                StockReservation.objects
                .values('product_variant_id')
                .annotate(total=Sum('quantity'))
            )
        }

        corrected = 0
        with transaction.atomic():
            held_ids = list(expected.keys())

            for variant in ProductVariant.objects.select_for_update().filter(id__in=held_ids):
                target = expected.get(variant.id, 0)
                if variant.reserved_quantity != target:
                    variant.reserved_quantity = target
                    variant.save(update_fields=['reserved_quantity', 'updated_at'])
                    corrected += 1

            stale = ProductVariant.objects.select_for_update().filter(
                reserved_quantity__gt=0
            )
            if held_ids:
                stale = stale.exclude(id__in=held_ids)
            for variant in stale:
                variant.reserved_quantity = 0
                variant.save(update_fields=['reserved_quantity', 'updated_at'])
                corrected += 1

        return corrected

class CartService:
    @staticmethod
    def merge_carts(user, guest_token):
        user_cart, _ = Cart.objects.get_or_create(user=user)
        skipped_items = []
        reduced_items = []

        if not guest_token:
            return user_cart, skipped_items, reduced_items

        with transaction.atomic():
            guest_cart = (
                Cart.objects.select_for_update()
                .filter(guest_token=guest_token, user=None)
                .first()
            )
            if not guest_cart:
                return user_cart, skipped_items, reduced_items

            StockReservation.objects.filter(cart=guest_cart).update(
                cart=user_cart, user=user
            )

            for g_item in guest_cart.items.all():
                variant = ProductVariant.objects.filter(
                    product=g_item.product,
                    size=g_item.selected_size,
                    color=g_item.selected_color or '',
                ).first()
                if variant is None and g_item.selected_color:
                    variant = ProductVariant.objects.filter(
                        product=g_item.product, size=g_item.selected_size,
                    ).first()

                if not variant:
                    skipped_items.append({
                        'product_id': str(g_item.product.id),
                        'product_name': g_item.product.name,
                        'selected_size': g_item.selected_size,
                        'requested_quantity': g_item.quantity,
                        'reason': f'Size "{g_item.selected_size}" is not available',
                    })
                    StockReservationService.sync(
                        user_cart, g_item.variant or variant, 0
                    )
                    continue

                available_stock = max(0, variant.stock_quantity - variant.reserved_quantity)

                if available_stock <= 0:
                    skipped_items.append({
                        'product_id': str(g_item.product.id),
                        'product_name': g_item.product.name,
                        'selected_size': g_item.selected_size,
                        'requested_quantity': g_item.quantity,
                        'reason': 'Out of stock',
                    })
                    StockReservationService.sync(user_cart, g_item.variant or variant, 0)
                    continue

                user_item = CartItem.objects.filter(
                    cart=user_cart,
                    product=g_item.product,
                    selected_size=g_item.selected_size,
                    selected_color=g_item.selected_color or '',
                ).first()

                if user_item:
                    desired = user_item.quantity + g_item.quantity
                    final_qty = min(desired, available_stock)
                    if final_qty < desired:
                        reduced_items.append({
                            'product_id': str(g_item.product.id),
                            'product_name': g_item.product.name,
                            'selected_size': g_item.selected_size,
                            'requested_quantity': desired,
                            'final_quantity': final_qty,
                        })
                    final_qty = max(1, final_qty)
                    user_item.quantity = final_qty
                    user_item.variant = variant
                    user_item.save(update_fields=['quantity', 'variant', 'updated_at'])
                else:
                    final_qty = min(g_item.quantity, available_stock)
                    if final_qty < g_item.quantity:
                        reduced_items.append({
                            'product_id': str(g_item.product.id),
                            'product_name': g_item.product.name,
                            'selected_size': g_item.selected_size,
                            'requested_quantity': g_item.quantity,
                            'final_quantity': final_qty,
                        })
                    final_qty = max(1, final_qty)
                    CartItem.objects.create(
                        cart=user_cart,
                        product=g_item.product,
                        selected_size=g_item.selected_size,
                        selected_color=g_item.selected_color or '',
                        variant=variant,
                        quantity=final_qty,
                    )

                try:
                    StockReservationService.sync(user_cart, variant, final_qty)
                except InsufficientStock:
                    reduced_items.append({
                        'product_id': str(g_item.product.id),
                        'product_name': g_item.product.name,
                        'selected_size': g_item.selected_size,
                        'requested_quantity': g_item.quantity,
                        'final_quantity': 0,
                    })

            guest_cart.hard_delete()

        return user_cart, skipped_items, reduced_items