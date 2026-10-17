from rest_framework import serializers
from .models import Order, OrderItem, OrderEvent

class OrderItemSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='product_name', required=False)
    image = serializers.CharField(source='product_image', required=False)
    selectedSize = serializers.CharField(source='selected_size', required=False)
    selectedColor = serializers.CharField(source='selected_color', required=False)

    class Meta:
        model = OrderItem
        fields = (
            'id', 'product', 'variant', 'product_name', 'name', 'product_image', 'image',
            'price', 'selected_size', 'selectedSize', 'selected_color', 'selectedColor', 'quantity'
        )

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['name'] = instance.product_name
        ret['image'] = instance.product_image
        ret['selectedSize'] = instance.selected_size
        ret['selectedColor'] = instance.selected_color
        ret['price'] = str(instance.price)
        return ret

class OrderEventSerializer(serializers.ModelSerializer):
    triggered_by_email = serializers.EmailField(source='triggered_by.email', read_only=True, allow_null=True)

    class Meta:
        model = OrderEvent
        fields = ('id', 'previous_status', 'new_status', 'triggered_by_email', 'notes', 'created_at')

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    events = OrderEventSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            'id', 'order_number', 'user', 'userId', 'customer_name', 'customer_email',
            'status', 'payment_status', 'payment_method', 'shipping_address',
            'items_total', 'shipping_fee', 'discount_amount', 'grand_total',
            'razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature',
            'items', 'events', 'created_at', 'updated_at'
        )
        read_only_fields = (
            'id', 'order_number', 'user', 'userId', 'status', 'payment_status',
            'items_total', 'shipping_fee', 'discount_amount', 'grand_total',
            'razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature',
            'events', 'created_at', 'updated_at'
        )

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['id'] = str(instance.id)
        ret['orderId'] = str(instance.id)
        ret['placedAt'] = instance.created_at.isoformat() if instance.created_at else ''
        ret['total'] = str(instance.grand_total)
        ret['subtotal'] = str(instance.items_total)
        ret['shipping'] = str(instance.shipping_fee)
        ret['tax'] = "0.00"
        ret['userName'] = instance.customer_name
        ret['userEmail'] = instance.customer_email
        ret['userId'] = instance.userId or (str(instance.user.id) if instance.user else '')
        return ret

