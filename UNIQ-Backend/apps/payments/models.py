from django.db import models
from django.conf import settings
from common.models import BaseModel
from apps.orders.models import Order

class Payment(BaseModel):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('succeeded', 'Succeeded'),
        ('failed', 'Failed'),
    )

    order = models.ForeignKey(Order, related_name='payments', on_delete=models.PROTECT)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='INR')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    razorpay_order_id = models.CharField(max_length=255, db_index=True, blank=True, default='')
    razorpay_payment_id = models.CharField(max_length=255, db_index=True, null=True, blank=True, default=None, unique=True)
    razorpay_signature = models.CharField(max_length=255, blank=True, default='')
    error_message = models.TextField(blank=True, default='')

    def __str__(self):
        return f"Payment order={self.razorpay_order_id} pay={self.razorpay_payment_id} ({self.status})"

class IdempotencyRecord(BaseModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name='idempotency_records')
    key = models.CharField(max_length=255, db_index=True)
    order_id = models.CharField(max_length=255, blank=True, default='')
    status_code = models.IntegerField()
    response_body = models.JSONField()

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'key'], name='unique_user_idempotency_key')
        ]

    def __str__(self):
        return f"IdempotencyKey: user={self.user_id} key={self.key} order={self.order_id}"

