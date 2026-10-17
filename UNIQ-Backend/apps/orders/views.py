import uuid
from rest_framework import viewsets, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction

from .models import Order, OrderItem
from .serializers import OrderSerializer
from .services import OrderService
from .tasks import send_order_confirmation_email
from common.permissions import is_admin_user
from apps.catalog.models import Product, ProductVariant
from apps.cart.models import Cart
from apps.cart.services import (
    PricingService,
    StockReservationService,
    CouponService,
    CouponError,
    ShippingService,
)

from decimal import Decimal, ROUND_HALF_UP
from django.db.models import Q

def get_reservation_carts(request):
    carts = []
    seen = set()

    def _add(cart):
        if cart and cart.id not in seen:
            seen.add(cart.id)
            carts.append(cart)

    if request.user and request.user.is_authenticated:
        _add(Cart.objects.filter(user=request.user).first())

    token = request.headers.get('X-Cart-Token') or request.headers.get('x-cart-token')
    if token:
        try:
            uuid.UUID(str(token), version=4)
            _add(Cart.objects.filter(guest_token=str(token), user=None).first())
        except (ValueError, TypeError):
            pass

    return carts

def release_holds(carts, variant):
    for cart in carts:
        try:
            StockReservationService.sync(cart, variant, 0)
        except Exception:
            pass

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_status']
    search_fields = ['order_number', 'customer_name', 'customer_email']
    ordering_fields = ['created_at', 'grand_total']

    def get_permissions(self):
        if self.action in ['create']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_authenticated:
            if is_admin_user(self.request.user):
                user_id_param = self.request.query_params.get('userId')
                if user_id_param:
                    qs = qs.filter(Q(userId=user_id_param) | Q(user__id=user_id_param))
                return qs
            return qs.filter(user=self.request.user)
        return Order.objects.none()

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        items_data = data.pop('items', [])

        user = request.user if request.user.is_authenticated else None
        user_id_val = str(user.id) if user else data.get('userId', '')

        customer_name = data.get('customer_name') or data.get('userName') or (user.name if user and hasattr(user, 'name') else '')
        customer_email = data.get('customer_email') or data.get('userEmail') or (user.email if user else '')

        if not items_data:
            return Response({'items': 'Order items are required.'}, status=status.HTTP_400_BAD_REQUEST)

        items_total_acc = Decimal('0.00')
        order_items_to_create = []
        reservation_carts = get_reservation_carts(request)

        coupon_code = data.get('coupon_code') or data.get('couponCode') or data.get('coupon')

        with transaction.atomic():
            order_number = OrderService.generate_order_number()
            order = Order.objects.create(
                order_number=order_number,
                user=user,
                userId=user_id_val,
                customer_name=customer_name,
                customer_email=customer_email,
                status='pending',
                payment_status='pending',
                payment_method=data.get('payment_method', 'razorpay'),
                shipping_address=data.get('shipping_address', {}),
                items_total=Decimal('0.00'),
                shipping_fee=Decimal('0.00'),
                discount_amount=Decimal('0.00'),
                grand_total=Decimal('0.00'),
                razorpay_order_id='',
                razorpay_payment_id='',
                razorpay_signature=''
            )

            for item_info in items_data:
                p_id = item_info.get('id') or item_info.get('product_id')
                qty_raw = item_info.get('quantity', 1)
                try:
                    qty = int(qty_raw)
                    if qty < 1:
                        raise ValueError()
                except (ValueError, TypeError):
                    transaction.set_rollback(True)
                    return Response({'quantity': 'Quantity must be an integer of at least 1.'}, status=status.HTTP_400_BAD_REQUEST)

                product_obj = None
                if p_id:
                    try:
                        valid_uuid = uuid.UUID(str(p_id))
                        product_obj = Product.objects.filter(id=valid_uuid, is_deleted=False, status='active').first()
                    except (ValueError, TypeError):
                        pass

                if not product_obj:
                    transaction.set_rollback(True)
                    return Response({'product': f'Valid active product for id "{p_id}" not found.'}, status=status.HTTP_400_BAD_REQUEST)

                selected_size = item_info.get('selectedSize', item_info.get('selected_size', ''))
                selected_color = item_info.get('selectedColor', item_info.get('selected_color', ''))

                variant = None
                if selected_size:
                    if selected_color:
                        variant = ProductVariant.objects.select_for_update().filter(product=product_obj, size=selected_size, color=selected_color).first()
                    if not variant:
                        variant = ProductVariant.objects.select_for_update().filter(product=product_obj, size=selected_size).first()

                if variant:
                    release_holds(reservation_carts, variant)

                    available = variant.stock_quantity - variant.reserved_quantity
                    if available < qty:
                        transaction.set_rollback(True)
                        return Response({'stock': f'Insufficient stock for product "{product_obj.name}" ({selected_size}). Requested: {qty}, Available: {available}.'}, status=status.HTTP_400_BAD_REQUEST)
                    variant.stock_quantity -= qty
                    variant.save(update_fields=['stock_quantity', 'updated_at'])

                unit_price = PricingService.calculate_item_unit_price(product_obj, variant)
                line_total = unit_price * Decimal(str(qty))
                items_total_acc += line_total

                order_items_to_create.append(OrderItem(
                    order=order,
                    product=product_obj,
                    variant=variant,
                    product_name=product_obj.name,
                    product_image=product_obj.image or item_info.get('image', ''),
                    price=unit_price,
                    selected_size=selected_size or (variant.size if variant else ''),
                    selected_color=selected_color or (variant.color if variant else ''),
                    quantity=qty
                ))

            OrderItem.objects.bulk_create(order_items_to_create)

            items_total_acc = items_total_acc.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

            discount_amount_val = Decimal('0.00')
            coupon_state = {'code': '', 'applied': False, 'error': ''}
            if coupon_code:
                try:
                    discount_amount_val, coupon = CouponService.evaluate(
                        coupon_code, items_total_acc
                    )
                    coupon_state = {'code': coupon.code, 'applied': True, 'error': ''}
                except CouponError as exc:
                    coupon_state = {
                        'code': str(coupon_code),
                        'applied': False,
                        'error': str(exc),
                    }

            shipping_fee_val = ShippingService.compute(
                max(Decimal('0.00'), items_total_acc - discount_amount_val)
            )

            grand_total_calc = max(
                Decimal('0.00'), items_total_acc + shipping_fee_val - discount_amount_val
            )

            order.items_total = items_total_acc
            order.shipping_fee = shipping_fee_val
            order.discount_amount = discount_amount_val
            order.grand_total = grand_total_calc.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            order.save(update_fields=[
                'items_total', 'shipping_fee', 'discount_amount',
                'grand_total', 'updated_at',
            ])

        transaction.on_commit(lambda: send_order_confirmation_email.delay(str(order.id)))

        payload = OrderSerializer(order).data
        if coupon_state.get('code'):
            payload['coupon'] = coupon_state
        return Response(payload, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        if not is_admin_user(request.user):
            return Response({'detail': 'Method not allowed for regular users.'}, status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not is_admin_user(request.user):
            return Response({'detail': 'Method not allowed for regular users.'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not is_admin_user(request.user):
            return Response({'detail': 'Method not allowed for regular users.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post', 'patch'], permission_classes=[IsAuthenticated])
    def update_status(self, request, pk=None):
        if not is_admin_user(request.user):
            return Response({'detail': 'Admin permission required.'}, status=status.HTTP_403_FORBIDDEN)
        order = self.get_object()
        raw_status = request.data.get('status')
        if not raw_status:
            return Response({'status': 'Status parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)

        target_status = raw_status.lower()
        if target_status == 'dispatched':
            target_status = 'shipped'

        try:
            updated_order = OrderService.transition_order_status(
                order=order,
                new_status=target_status,
                user=request.user,
                notes=request.data.get('notes', 'Admin status update')
            )
            return Response(OrderSerializer(updated_order).data)
        except ValueError as err:
            return Response({'message': str(err)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def cancel(self, request, pk=None):
        order = self.get_object()
        if not is_admin_user(request.user) and order.user != request.user:
            return Response({'detail': 'You do not have permission to cancel this order.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            updated_order = OrderService.transition_order_status(
                order=order,
                new_status='cancelled',
                user=request.user,
                notes='Cancelled by user'
            )
            return Response(OrderSerializer(updated_order).data)
        except ValueError as err:
            return Response({'message': str(err)}, status=status.HTTP_400_BAD_REQUEST)

