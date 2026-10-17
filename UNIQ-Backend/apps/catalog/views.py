from django.db import transaction
from django.db.models import Q, Sum, F
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from common.permissions import IsAdminUserOrReadOnly, is_admin_user
from common.pagination import StandardResultsSetPagination
from .filters import ProductFilter
from .models import Category, FilterConfig, Product, ProductVariant
from .serializers import CategorySerializer, ProductSerializer, InventorySerializer


def visible_products(request):
    qs = (
        Product.objects
        .filter(is_deleted=False)
        .select_related('category')
        .prefetch_related('variants', 'images')
    )
    if not is_admin_user(request.user):
        qs = qs.filter(status='active')
    return qs


def category_from_request(request):
    val = (
        request.data.get('category_slug')
        or request.data.get('categoryId')
        or request.data.get('category')
    )
    if not val or not isinstance(val, str):
        return None
    cat = Category.objects.filter(Q(slug=val) | Q(label__iexact=val)).first()
    if not cat:
        raise ValidationError({'category': f'Category "{val}" not found.'})
    return cat


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminUserOrReadOnly]
    lookup_field = 'slug'


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdminUserOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'brand', 'type', 'color', 'fit', 'category__label', 'category__slug']
    ordering_fields = ['price', 'created_at', 'name']

    def get_queryset(self):
        qs = visible_products(self.request)
        slug = self.request.query_params.get('categoryId') or self.request.query_params.get('category')
        if slug:
            qs = qs.filter(Q(category__slug=slug) | Q(category__label__iexact=slug))
        return qs

    def perform_create(self, serializer):
        serializer.save(category=category_from_request(self.request))

    def perform_update(self, serializer):
        category = category_from_request(self.request)
        if category:
            serializer.save(category=category)
        else:
            serializer.save()


class CategoryProductsView(APIView):
    permission_classes = [IsAdminUserOrReadOnly]

    def get(self, request, category_slug):
        category = get_object_or_404(Category, slug=category_slug)
        products = visible_products(request).filter(category=category)
        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(products, request)
        if page is not None:
            serializer = ProductSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        return Response(ProductSerializer(products, many=True).data)

    def post(self, request, category_slug):
        category = get_object_or_404(Category, slug=category_slug)
        serializer = ProductSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.save(category=category)
        return Response(ProductSerializer(product).data, status=status.HTTP_201_CREATED)


class CategoryProductDetailView(APIView):
    permission_classes = [IsAdminUserOrReadOnly]

    def get_product(self, request, category_slug, product_id):
        return get_object_or_404(
            visible_products(request), id=product_id, category__slug=category_slug
        )

    def get(self, request, category_slug, product_id):
        product = self.get_product(request, category_slug, product_id)
        return Response(ProductSerializer(product).data)

    def put(self, request, category_slug, product_id):
        product = self.get_product(request, category_slug, product_id)
        serializer = ProductSerializer(product, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def patch(self, request, category_slug, product_id):
        return self.put(request, category_slug, product_id)

    def delete(self, request, category_slug, product_id):
        self.get_product(request, category_slug, product_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


DEFAULT_FILTERS = {
    "sizes": ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
    "brands": ["UN1Q", "UN1Q HeavyDuty@1.0", "UN1Q Air"],
    "colors": ["Black", "White", "Navy", "Grey", "Olive", "Beige", "Red", "Blue",
               "Green", "Brown", "Maroon", "Orange", "Yellow", "Pink", "Purple"],
    "fits": ["Oversized Fit", "Regular Fit", "Straight Fit", "Baggy Fit",
             "Loose Fit", "Detachable Hood", "Classic Fit", "Wide Leg Fit"],
    "sleeves": ["Half Sleeve", "Full Sleeve", "Sleeveless"],
    "offers": ["Buy 2 for 1199", "Buy 3 for 1199"],
    "discounts": ["10%", "20%", "30%", "40%", "50%"],
    "shoeSizes": ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10"],
    "shoeDiscounts": ["30%", "40%", "50%"],
    "bagTypes": ["Backpack", "Sling Bag", "Duffle Bag", "Laptop Bag", "Gym Bag"],
    "capTypes": ["Snapback", "Baseball Cap", "Bucket Hat", "Beanie", "Dad Cap"],
}


class FiltersView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        result = {cfg.key: cfg.values for cfg in FilterConfig.objects.all()}
        for key, values in DEFAULT_FILTERS.items():
            result.setdefault(key, values)
        return Response(result)
    


class InventoryViewSet(viewsets.ModelViewSet):

    queryset = ProductVariant.objects.select_related('product', 'product__category').filter(product__is_deleted=False)
    serializer_class = InventorySerializer
    permission_classes = [IsAdminUserOrReadOnly]
    pagination_class = StandardResultsSetPagination
    http_method_names = ['get', 'patch', 'head', 'options']
    
    
    def get_queryset(self):
        qs = ProductVariant.objects.select_related('product', 'product__category').filter(product__is_deleted=False)
        search_query = self.request.query_params.get('search', '').strip()
        if search_query:
            qs = qs.filter(
                Q(sku__icontains=search_query) |
                Q(product__name__icontains=search_query)
            )
        category_slug = self.request.query_params.get('category', '').strip()
        if category_slug:
            qs = qs.filter(product__category__slug=category_slug)
        stock_status = self.request.query_params.get('status', '').strip().lower()
        if stock_status == 'out_of_stock':
            qs = qs.filter(stock_quantity__lte=F('reserved_quantity'))
        elif stock_status == 'low_stock':
            qs = qs.filter(
                stock_quantity__gt=F('reserved_quantity'),
                stock_quantity__lte=F('reserved_quantity') + 5
            )
        elif stock_status == 'in_stock':
            qs = qs.filter(stock_quantity__gt=F('reserved_quantity') + 5)
        return qs.order_by('stock_quantity', 'product__name')
    
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        all_variants = ProductVariant.objects.filter(product__is_deleted=False)
        total_units = all_variants.aggregate(total=Sum('stock_quantity'))['total'] or 0
        reserved_units = all_variants.aggregate(reserved=Sum('reserved_quantity'))['reserved'] or 0
        return Response({
            'total_units': total_units,
            'reserved_units': reserved_units,
            'out_of_stock_count': all_variants.filter(stock_quantity__lte=F('reserved_quantity')).count(),
            'low_stock_count': all_variants.filter(
                stock_quantity__gt=F('reserved_quantity'),
                stock_quantity__lte=F('reserved_quantity') + 5
            ).count(),
            'total_skus': all_variants.count(),
        }, status=status.HTTP_200_OK)

    

