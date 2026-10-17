from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from common.models import BaseModel
from apps.catalog.models import Product

class Review(BaseModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='reviews', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, related_name='reviews', on_delete=models.CASCADE)
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    title = models.CharField(max_length=255, blank=True, default='')
    comment = models.TextField()
    is_verified_purchase = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'product'],
                condition=models.Q(is_deleted=False),
                name='unique_active_user_product_review'
            )
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.rating}* by {self.user.email} for {self.product.name}"

class ReviewSummary(BaseModel):
    product = models.OneToOneField(Product, related_name='review_summary', on_delete=models.CASCADE)
    summary_text = models.TextField()
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    total_reviews = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"Summary for {self.product.name} ({self.total_reviews} reviews)"
