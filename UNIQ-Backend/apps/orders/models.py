import uuid
from django.db import models
from django.conf import settings
from common.models import BaseModel
from apps.catalog.models import Product, ProductVariant

class Order(BaseModel):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('dispatched', 'Dispatched'),
        ('delivered', 'Delivered'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )

    PAYMENT_STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
    )

    order_number = models.CharField(max_length=50, unique=True, db_index=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='orders', on_delete=models.SET_NULL, null=True, blank=True)
    userId = models.CharField(max_length=255, blank=True, default='')
    
    customer_name = models.CharField(max_length=255, blank=True, default='')
    customer_email = models.EmailField(blank=True, default='')
    
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending', db_index=True)
    payment_status = models.CharField(max_length=30, choices=PAYMENT_STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=50, default='razorpay')
    
    shipping_address = models.JSONField(default=dict)
    
    items_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    razorpay_order_id = models.CharField(max_length=255, blank=True, default='', db_index=True)
    razorpay_payment_id = models.CharField(max_length=255, blank=True, default='', db_index=True)
    razorpay_signature = models.CharField(max_length=255, blank=True, default='')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order {self.order_number} ({self.status})"

    def can_transition_to(self, new_status):
        st = (new_status or '').lower()
        if st == 'dispatched':
            st = 'shipped'

        current_st = (self.status or '').lower()
        if current_st == 'dispatched':
            current_st = 'shipped'

        allowed_transitions = {
            'pending': ['confirmed', 'processing', 'shipped', 'dispatched', 'delivered', 'cancelled'],
            'confirmed': ['processing', 'shipped', 'dispatched', 'delivered', 'cancelled'],
            'processing': ['shipped', 'dispatched', 'delivered', 'cancelled'],
            'shipped': ['delivered', 'cancelled', 'processing'],
            'delivered': ['completed', 'cancelled'],
            'completed': [],
            'cancelled': [],
        }
        return st in allowed_transitions.get(current_st, [])

class OrderItem(BaseModel):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
    variant = models.ForeignKey(ProductVariant, related_name='order_items', on_delete=models.SET_NULL, null=True, blank=True)
    product_name = models.CharField(max_length=255)
    product_image = models.URLField(blank=True, default='')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    selected_size = models.CharField(max_length=20, blank=True, default='')
    selected_color = models.CharField(max_length=50, blank=True, default='')
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.quantity}x {self.product_name} in Order {self.order.order_number}"

class OrderEvent(BaseModel):
    order = models.ForeignKey(Order, related_name='events', on_delete=models.CASCADE)
    previous_status = models.CharField(max_length=30)
    new_status = models.CharField(max_length=30)
    triggered_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-created_at']

