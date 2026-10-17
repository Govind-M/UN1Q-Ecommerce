from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CartViewSet, WishlistViewSet, CouponViewSet

router = DefaultRouter()
router.register('coupons', CouponViewSet, basename='coupon')
router.register('cart', CartViewSet, basename='cart')
router.register('wishlist', WishlistViewSet, basename='wishlist')

urlpatterns = [
    path('', include(router.urls)),
]
