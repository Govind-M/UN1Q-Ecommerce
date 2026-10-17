from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReviewViewSet, ReviewSummaryViewSet

router = DefaultRouter()
router.register('reviews', ReviewViewSet, basename='review')
router.register('review-summaries', ReviewSummaryViewSet, basename='review-summary')

urlpatterns = [
    path('', include(router.urls)),
]
