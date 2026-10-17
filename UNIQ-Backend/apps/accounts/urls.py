from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, CustomTokenObtainPairView, UserProfileView, UserViewSet, AddressViewSet
)

router = DefaultRouter()
router.register('users', UserViewSet, basename='user')
router.register('addresses', AddressViewSet, basename='address')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register_slash'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair_slash'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh_slash'),
    path('profile/', UserProfileView.as_view(), name='profile_slash'),
    path('', include(router.urls)),
]

