from rest_framework import serializers
from .models import Cart, CartItem, Wishlist, Coupon
from apps.catalog.serializers import ProductSerializer

from decimal import Decimal, ROUND_HALF_UP
from .services import PricingService

class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.CharField(write_only=True)
    selected_color = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = CartItem
        fields = ('id', 'product', 'product_id', 'selected_size', 'selected_color', 'variant', 'quantity', 'created_at')

class CartSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()
    total_items = serializers.SerializerMethodField()
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ('id', 'items', 'total_items', 'subtotal', 'created_at', 'updated_at')

    def get_valid_items(self, obj):
        return [
            item for item in obj.items.all()
            if item.product and not getattr(item.product, 'is_deleted', False) and getattr(item.product, 'status', 'active') == 'active'
        ]

    def get_items(self, obj):
        valid_items = self.get_valid_items(obj)
        return CartItemSerializer(valid_items, many=True, context=self.context).data

    def get_total_items(self, obj):
        return sum(item.quantity for item in self.get_valid_items(obj))

    def get_subtotal(self, obj):
        total = Decimal('0.00')
        for item in self.get_valid_items(obj):
            total += PricingService.calculate_item_total_price(
                product=item.product,
                variant=item.variant,
                quantity=item.quantity
            )
        return str(total.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))

class WishlistSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.CharField(write_only=True)

    class Meta:
        model = Wishlist
        fields = ('id', 'product', 'product_id', 'created_at')

class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = ('id', 'code', 'discount_type', 'discount_value', 'min_order_value', 'is_active', 'expires_at')
