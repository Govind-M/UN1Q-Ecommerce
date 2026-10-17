from celery import shared_task
from decimal import Decimal, ROUND_HALF_UP
from django.db.models import Avg
from .models import Review, ReviewSummary
from apps.catalog.models import Product

@shared_task(acks_late=True, max_retries=3)
def generate_review_summary(product_id):
    try:
        product = Product.objects.get(id=product_id)
        reviews = Review.objects.filter(product=product)
        total = reviews.count()
        
        if total == 0:
            ReviewSummary.objects.filter(product=product).delete()
            return f"Cleaned summary for product {product_id} (0 reviews)"

        raw_avg = reviews.aggregate(Avg('rating'))['rating__avg'] or 0
        avg_decimal = Decimal(str(raw_avg)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        
        summary_text = f"Based on {total} customer review(s), this product has an average rating of {avg_decimal} out of 5 stars."

        summary_obj, _ = ReviewSummary.objects.get_or_create(product=product)
        summary_obj.average_rating = avg_decimal
        summary_obj.total_reviews = total
        summary_obj.summary_text = summary_text
        summary_obj.save(update_fields=['average_rating', 'total_reviews', 'summary_text', 'updated_at'])

        return f"Updated review summary for product {product.name}"
    except Exception as exc:
        raise generate_review_summary.retry(exc=exc, countdown=60)
