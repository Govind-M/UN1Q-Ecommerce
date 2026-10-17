import uuid
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import ValidationError
from django.db import transaction

from .models import Review, ReviewSummary
from .serializers import ReviewSerializer, ReviewSummarySerializer
from .tasks import generate_review_summary
from apps.orders.models import OrderItem
from apps.catalog.models import Product
from common.permissions import IsOwnerOrAdmin

class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        if self.action == 'create':
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsOwnerOrAdmin()]

    def get_queryset(self):
        qs = Review.objects.select_related('user', 'product').all()
        product_param = self.request.query_params.get('product')
        if product_param:
            try:
                valid_uuid = uuid.UUID(str(product_param))
                qs = qs.filter(product_id=valid_uuid)
            except (ValueError, TypeError):
                raise ValidationError({'product': f'"{product_param}" is not a valid UUID.'})
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        product = serializer.validated_data.get('product')

        if not product or product.is_deleted or product.status != 'active':
            raise ValidationError({'product': 'Reviews can only be added to active, existing products.'})

        if Review.objects.filter(user=user, product=product).exists():
            raise ValidationError({'product': 'You have already submitted a review for this product.'})

        is_verified = OrderItem.objects.filter(
            order__user=user,
            product=product,
            order__status__in=['delivered', 'completed'],
            order__payment_status='paid'
        ).exists()

        review = serializer.save(user=user, is_verified_purchase=is_verified)
        product_id_str = str(review.product.id)
        transaction.on_commit(lambda: generate_review_summary.delay(product_id_str))

    def perform_update(self, serializer):
        review = serializer.save()
        product_id_str = str(review.product.id)
        transaction.on_commit(lambda: generate_review_summary.delay(product_id_str))

    def perform_destroy(self, instance):
        product_id_str = str(instance.product.id)
        instance.delete()
        transaction.on_commit(lambda: generate_review_summary.delay(product_id_str))

class ReviewSummaryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ReviewSummary.objects.select_related('product').all()
    serializer_class = ReviewSummarySerializer
    permission_classes = [AllowAny]
    lookup_field = 'product_id'
