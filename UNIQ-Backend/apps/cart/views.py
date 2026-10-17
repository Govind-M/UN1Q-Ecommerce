import uuid
from decimal import Decimal, ROUND_HALF_UP

from django.db import IntegrityError, transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import ValidationError

from .models import Cart, CartItem, Wishlist, Coupon
from .serializers import CartSerializer, CartItemSerializer, WishlistSerializer, CouponSerializer
from .services import CartService, StockReservationService, InsufficientStock
from apps.catalog.models import Product, ProductVariant

def validate_uuid_param(val, param_name='product_id'):
    if not val:
        raise ValidationError({param_name: f'{param_name} is required.'})
    try:
        u = uuid.UUID(str(val))
        if str(u).lower() != str(val).lower():
            raise ValueError()
    except (ValueError, TypeError, AttributeError):
        raise ValidationError({param_name: f'"{val}" is not a valid UUID.'})
    return str(val)

def get_cart_for_request(request):
    if request.user and request.user.is_authenticated:
        try:
            cart, _ = Cart.objects.get_or_create(user=request.user)
        except IntegrityError:
            cart = Cart.objects.get(user=request.user)
    else:
        token = request.headers.get('X-Cart-Token') or request.headers.get('x-cart-token')
        if not token:
            raise ValidationError({'guest_token': 'X-Cart-Token header is required for guest operations.'})
        try:
            val = uuid.UUID(str(token), version=4)
            if str(val).lower() != str(token).lower():
                raise ValueError()
        except (ValueError, TypeError, AttributeError):
            raise ValidationError({'guest_token': 'X-Cart-Token header must be a valid UUID4 string.'})

        try:
            cart, _ = Cart.objects.get_or_create(guest_token=str(token), user=None)
        except IntegrityError:
            cart = Cart.objects.get(guest_token=str(token), user=None)

    return Cart.objects.filter(id=cart.id).prefetch_related('items__product').first()

def resolve_variant(product, selected_size, selected_color=None, variant_id=None):
    variant = None

    if variant_id:
        try:
            variant = ProductVariant.objects.filter(
                id=uuid.UUID(str(variant_id)), product=product
            ).first()
        except (ValueError, TypeError):
            variant = None

    if not variant and selected_color:
        variant = ProductVariant.objects.filter(
            product=product, size=selected_size, color=selected_color
        ).first()

    if not variant:
        variant = ProductVariant.objects.filter(
            product=product, size=selected_size
        ).first()

    return variant

def get_selected_color(request):
    if 'selected_color' in request.data:
        return request.data.get('selected_color') or ''
    if 'selectedColor' in request.data:
        return request.data.get('selectedColor') or ''
    return None

class CartViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def _get_cart(self, request):
        return get_cart_for_request(request)

    def list(self, request):
        cart = self._get_cart(request)
        return Response(CartSerializer(cart).data)

    @action(detail=False, methods=['post'])
    def add(self, request):
        cart = self._get_cart(request)
        product_id = request.data.get('product_id') or request.data.get('id')
        selected_size = request.data.get('selected_size') or request.data.get('selectedSize')
        selected_color = request.data.get('selected_color') or request.data.get('selectedColor') or request.data.get('color') or ''
        variant_id = request.data.get('variant_id') or request.data.get('variantId')
        raw_quantity = request.data.get('quantity', request.data.get('qty'))

        valid_product_id = validate_uuid_param(product_id, 'product_id')

        if not selected_size:
            raise ValidationError({'selected_size': 'selected_size is required.'})

        if raw_quantity is None:
            quantity = 1
        else:
            try:
                quantity = int(raw_quantity)
                if quantity < 1:
                    raise ValueError()
            except (ValueError, TypeError):
                raise ValidationError({'quantity': 'quantity must be an integer of at least 1.'})

        product = Product.objects.filter(id=valid_product_id, is_deleted=False, status='active').first()
        if not product:
            raise ValidationError({'product_id': f'Active product with id "{valid_product_id}" not found.'})

        variant = resolve_variant(product, selected_size, selected_color, variant_id)
        if not variant:
            raise ValidationError({'selected_size': f'Size "{selected_size}" is not available for this product.'})

        if not selected_color and variant.color:
            selected_color = variant.color

        available_stock = max(0, variant.stock_quantity - variant.reserved_quantity)
        existing_item = CartItem.objects.filter(
            cart=cart, product=product,
            selected_size=selected_size, selected_color=selected_color
        ).first()
        existing_qty = existing_item.quantity if existing_item else 0
        total_requested = existing_qty + quantity

        if total_requested > available_stock:
            raise ValidationError({'quantity': f'Requested quantity ({total_requested}) exceeds available stock ({available_stock}).'})

        try:
            with transaction.atomic():
                if existing_item:
                    existing_item.quantity = total_requested
                    existing_item.variant = variant
                    existing_item.save(update_fields=['quantity', 'variant', 'updated_at'])
                else:
                    try:
                        with transaction.atomic():
                            CartItem.objects.create(
                                cart=cart,
                                product=product,
                                selected_size=selected_size,
                                selected_color=selected_color,
                                variant=variant,
                                quantity=quantity,
                            )
                    except IntegrityError:
                        item = CartItem.objects.get(
                            cart=cart, product=product,
                            selected_size=selected_size, selected_color=selected_color
                        )
                        new_total = item.quantity + quantity
                        if new_total > available_stock:
                            raise ValidationError({'quantity': f'Requested quantity ({new_total}) exceeds available stock ({available_stock}).'})
                        item.quantity = new_total
                        item.variant = variant
                        item.save(update_fields=['quantity', 'variant', 'updated_at'])
                        total_requested = new_total

                StockReservationService.sync(cart, variant, total_requested)

        except InsufficientStock as exc:
            raise ValidationError({'quantity': str(exc)})

        cart = self._get_cart(request)
        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def remove(self, request):
        cart = self._get_cart(request)
        product_id = request.data.get('product_id') or request.data.get('id')
        selected_size = request.data.get('selected_size') or request.data.get('selectedSize')

        valid_product_id = validate_uuid_param(product_id, 'product_id')
        if not selected_size:
            raise ValidationError({'selected_size': 'selected_size is required.'})

        with transaction.atomic():
            items = CartItem.objects.select_for_update().filter(
                cart=cart, product_id=valid_product_id, selected_size=selected_size
            )
            color_filter = get_selected_color(request)
            if color_filter is not None:
                items = items.filter(selected_color=color_filter)

            for item in items:
                StockReservationService.sync(cart, item.variant, 0)
            items.delete()

        cart = self._get_cart(request)
        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def update_quantity(self, request):
        cart = self._get_cart(request)
        product_id = request.data.get('product_id') or request.data.get('id')
        selected_size = request.data.get('selected_size') or request.data.get('selectedSize')
        action_type = request.data.get('action')

        valid_product_id = validate_uuid_param(product_id, 'product_id')
        if not selected_size:
            raise ValidationError({'selected_size': 'selected_size is required.'})
        if action_type not in ('increase', 'decrease'):
            raise ValidationError({'action': "action must be 'increase' or 'decrease'."})

        with transaction.atomic():
            item_query = CartItem.objects.select_for_update().filter(
                cart=cart, product_id=valid_product_id, selected_size=selected_size
            )
            color_filter = get_selected_color(request)
            if color_filter is not None:
                item_query = item_query.filter(selected_color=color_filter)
            item = item_query.first()

            if item:
                if action_type == 'increase':
                    variant = item.variant or resolve_variant(
                        item.product, selected_size, item.selected_color
                    )
                    if not variant:
                        raise ValidationError({'selected_size': f'Size "{selected_size}" is not available for this product.'})

                    new_qty = item.quantity + 1
                    try:
                        StockReservationService.sync(cart, variant, new_qty)
                    except InsufficientStock as exc:
                        raise ValidationError({'quantity': str(exc)})

                    item.quantity = new_qty
                    item.variant = variant
                    item.save(update_fields=['quantity', 'variant', 'updated_at'])

                elif action_type == 'decrease':
                    new_qty = item.quantity - 1
                    if new_qty <= 0:
                        variant = item.variant
                        item.hard_delete()
                        StockReservationService.sync(cart, variant, 0)
                    else:
                        StockReservationService.sync(cart, item.variant, new_qty)
                        item.quantity = new_qty
                        item.save(update_fields=['quantity', 'updated_at'])

        cart = self._get_cart(request)
        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def merge(self, request):
        guest_token = (
            request.data.get('guest_token')
            or request.data.get('session_key')
            or request.headers.get('X-Cart-Token')
            or request.headers.get('x-cart-token')
        )
        cart, skipped, reduced = CartService.merge_carts(request.user, guest_token)
        res_data = CartSerializer(cart).data
        res_data['skipped_items'] = skipped
        res_data['reduced_items'] = reduced
        return Response(res_data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def clear(self, request):
        cart = self._get_cart(request)

        with transaction.atomic():
            for item in cart.items.select_for_update():
                StockReservationService.sync(cart, item.variant, 0)
            cart.items.all().delete()

        cart = self._get_cart(request)
        return Response(CartSerializer(cart).data)

class WishlistViewSet(viewsets.ModelViewSet):
    serializer_class = WishlistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        product_id = self.request.data.get('product_id')
        valid_product_id = validate_uuid_param(product_id, 'product_id')
        product = get_object_or_404(Product, id=valid_product_id, is_deleted=False, status='active')
        try:
            with transaction.atomic():
                Wishlist.objects.create(user=self.request.user, product=product)
        except IntegrityError:
            pass

class CouponViewSet(viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    serializer_class = CouponSerializer

    @action(detail=False, methods=['post'])
    def validate_coupon(self, request):
        code = request.data.get('code')
        if not code:
            raise ValidationError({'code': 'Coupon code is required.'})

        subtotal = Decimal('0.00')
        raw_subtotal = request.data.get('cart_total') or request.data.get('subtotal')

        if raw_subtotal is not None:
            try:
                subtotal = Decimal(str(raw_subtotal))
            except Exception:
                subtotal = Decimal('0.00')

        if subtotal <= Decimal('0.00'):
            try:
                cart = get_cart_for_request(request)
                if cart and cart.items.count() > 0:
                    subtotal_str = CartSerializer(cart).data.get('subtotal', '0.00')
                    subtotal = Decimal(subtotal_str)
            except Exception:
                pass

        if subtotal <= Decimal('0.00'):
            raise ValidationError({'cart': 'Cart subtotal must be greater than zero.'})

        coupon = Coupon.objects.filter(code__iexact=code.strip()).first()
        if not coupon:
            raise ValidationError({'code': 'Invalid coupon code.'})

        if not coupon.is_active:
            raise ValidationError({'coupon': 'Coupon is inactive.'})

        if coupon.expires_at and coupon.expires_at < timezone.now():
            raise ValidationError({'coupon': 'Coupon has expired.'})

        min_val = Decimal(str(coupon.min_order_value))
        if subtotal < min_val:
            raise ValidationError({'coupon': f'Minimum order value for code {coupon.code} is Rs.{min_val}'})

        discount_val = Decimal(str(coupon.discount_value))
        if coupon.discount_type == 'percentage':
            discount_amount = (subtotal * discount_val) / Decimal('100')
            if coupon.max_discount_amount:
                max_disc = Decimal(str(coupon.max_discount_amount))
                discount_amount = min(discount_amount, max_disc)
        else:
            discount_amount = min(discount_val, subtotal)

        discount_amount = discount_amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        final_total = max(Decimal('0.00'), subtotal - discount_amount).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

        return Response({
            'valid': True,
            'code': coupon.code,
            'discount_type': coupon.discount_type,
            'discount_value': str(coupon.discount_value),
            'subtotal': str(subtotal),
            'discount_amount': str(discount_amount),
            'final_total': str(final_total),
        }, status=status.HTTP_200_OK)