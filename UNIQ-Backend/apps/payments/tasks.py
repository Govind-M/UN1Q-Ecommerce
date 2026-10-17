from datetime import timedelta

from celery import shared_task
from django.utils import timezone

from .models import IdempotencyRecord

IDEMPOTENCY_RETENTION_DAYS = 14

@shared_task(name='apps.payments.tasks.purge_old_idempotency_records')
def purge_old_idempotency_records():
    cutoff = timezone.now() - timedelta(days=IDEMPOTENCY_RETENTION_DAYS)
    count = IdempotencyRecord.all_objects.filter(created_at__lt=cutoff).delete()
    return f"Purged {count} idempotency record(s) older than {IDEMPOTENCY_RETENTION_DAYS} days."