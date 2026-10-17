from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, ProductViewSet, FiltersView,
    CategoryProductsView, CategoryProductDetailView, InventoryViewSet
)

router = DefaultRouter()
router.register('categories', CategoryViewSet, basename='category')
router.register('products', ProductViewSet, basename='product')
router.register('inventory', InventoryViewSet, basename='inventory')

urlpatterns = [
    path('filters/', FiltersView.as_view(), name='filters_slash'),
    path('products/', ProductViewSet.as_view({'get': 'list', 'post': 'create'}), name='product_list_slash'),
    path('products/<uuid:pk>/', ProductViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='product_detail_slash'),
    path('', include(router.urls)),
    path('<slug:category_slug>/', CategoryProductsView.as_view(), name='category_products_slash'),
    path('<slug:category_slug>/<uuid:product_id>/', CategoryProductDetailView.as_view(), name='category_product_detail_slash'),
]

