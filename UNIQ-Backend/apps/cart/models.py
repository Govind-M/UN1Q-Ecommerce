from django.db import models
from django.conf import settings
from common.models import BaseModel
from apps.catalog.models import Product, ProductVariant

class Cart(BaseModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name='cart')
    guest_token = models.CharField(max_length=255, null=True, blank=True, db_index=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['guest_token'],
                name='unique_guest_token',
                condition=models.Q(guest_token__isnull=False)
            )
        ]

    def delete(self, using=None, keep_parents=False):
        super().hard_delete()

    def __str__(self):
        if self.user:
            return f"Cart for {self.user.email}"
        return f"Guest Cart ({self.guest_token})"

class CartItem(BaseModel):
    cart = models.ForeignKey(Cart, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    selected_size = models.CharField(max_length=20)
    selected_color = models.CharField(max_length=50, blank=True, default='')
    variant = models.ForeignKey(ProductVariant, null=True, blank=True, on_delete=models.SET_NULL, related_name='cart_items')
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ('cart', 'product', 'selected_size', 'selected_color')

    def delete(self, using=None, keep_parents=False):
        super().hard_delete()

    def __str__(self):
        color_str = f" / {self.selected_color}" if self.selected_color else ""
        return f"{self.quantity}x {self.product.name} ({self.selected_size}{color_str})"

class Wishlist(BaseModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='wishlist', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('user', 'product')

    def delete(self, using=None, keep_parents=False):
        super().hard_delete()

class Coupon(BaseModel):
    DISCOUNT_TYPE_CHOICES = (
        ('percentage', 'Percentage'),
        ('fixed', 'Fixed Amount'),
    )

    code = models.CharField(max_length=50, unique=True, db_index=True)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE_CHOICES, default='percentage')
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    min_order_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_discount_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.code} ({self.discount_value} {self.discount_type})"

class StockReservation(BaseModel):
    cart = models.ForeignKey('cart.Cart', null=True, blank=True, on_delete=models.SET_NULL, related_name='stock_reservations')
    product_variant = models.ForeignKey(ProductVariant, related_name='reservations', on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    expires_at = models.DateTimeField(db_index=True)

    def delete(self, using=None, keep_parents=False):
        super().hard_delete()

    def __str__(self):
        return f"Reservation of {self.quantity} for {self.product_variant.sku}"