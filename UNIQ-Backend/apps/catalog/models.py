import uuid
from django.db import models
from common.models import BaseModel
from apps.accounts.models import User

class Category(BaseModel):
    GENDER_CHOICES = (
        ('men', 'Men'),
        ('women', 'Women'),
        ('unisex', 'Unisex'),
    )

    slug = models.CharField(max_length=100, unique=True, db_index=True) 
    label = models.CharField(max_length=100) 
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, default='unisex')
    image = models.URLField(blank=True, default='')

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['label']

    def __str__(self):
        return f"{self.label} ({self.gender})"

class Product(BaseModel):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    )

    name = models.CharField(max_length=255, db_index=True)
    type = models.CharField(max_length=100, blank=True, default='')
    brand = models.CharField(max_length=100, blank=True, default='')
    color = models.CharField(max_length=50, blank=True, default='')
    fit = models.CharField(max_length=100, blank=True, default='')
    sleeve = models.CharField(max_length=100, blank=True, default='')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.CharField(max_length=20, blank=True, null=True, default=None)
    offer = models.CharField(max_length=255, blank=True, null=True, default=None)
    image = models.URLField(blank=True, default='')

    image_file = models.ImageField(
        upload_to='products/',
        blank=True,
        null=True,
    )
    category = models.ForeignKey(Category, related_name='products', on_delete=models.SET_NULL, null=True, blank=True)
    gender = models.CharField(max_length=20, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    size = models.JSONField(default=list, blank=True) 
    attributes = models.JSONField(default=dict, blank=True) 

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

class ProductVariant(BaseModel):
    product = models.ForeignKey(Product, related_name='variants', on_delete=models.CASCADE)
    sku = models.CharField(max_length=100, unique=True)
    size = models.CharField(max_length=20)
    color = models.CharField(max_length=50, blank=True, default='')
    price_override = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock_quantity = models.PositiveIntegerField(default=100)
    reserved_quantity = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('product', 'size', 'color')
        constraints = [
            models.CheckConstraint(
                condition=models.Q(reserved_quantity__lte=models.F('stock_quantity')),
                name='reserved_lte_stock'
            )
        ]

    def __str__(self):
        return f"{self.product.name} - {self.size} (SKU: {self.sku})"

    @property
    def available_stock(self):
        return max(0, self.stock_quantity - self.reserved_quantity)
    
    

class ProductImage(BaseModel):
    product = models.ForeignKey(
        Product,
        related_name='images',
        on_delete=models.CASCADE,
    )
    image_url = models.URLField(blank=True, default='')
    image_file = models.ImageField(
        upload_to='product-gallery/',
        blank=True,
        null=True,
    )
    is_primary = models.BooleanField(default=False)
    display_order = models.IntegerField(default=0)

    class Meta:
        ordering = ['display_order']
        
        

class FilterConfig(models.Model):
    key = models.CharField(max_length=50, unique=True) 
    values = models.JSONField(default=list)

    def __str__(self):
        return self.key
    
    
class InventoryLog(BaseModel):

    REASON_CHOICES = (
        ('manual_restock', 'Manual Restock / Inward Shipment'),
        ('manual_correction', 'Physical Inventory Count Adjustment'),
        ('order_deduction', 'Deducted for Order Fulfilment'),
        ('order_cancellation', 'Restored from Cancelled Order'),
        ('damaged_shrinkage', 'Damaged / Discarded Units'),
    )
    variant = models.ForeignKey(ProductVariant, related_name='inventory_logs', on_delete=models.CASCADE)
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    previous_stock = models.PositiveIntegerField()
    new_stock = models.PositiveIntegerField()
    quantity_changed = models.IntegerField() 
    reason = models.CharField(max_length=50, choices=REASON_CHOICES, default='manual_restock')
    notes = models.TextField(blank=True, default='')
    class Meta:
        ordering = ['-created_at']
    def __str__(self):
        return f"{self.variant.sku}: {self.quantity_changed} ({self.reason})"
