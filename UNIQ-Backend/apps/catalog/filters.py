from django.db.models import Q
import django_filters
from .models import Product

class ProductFilter(django_filters.FilterSet):
    q = django_filters.CharFilter(method='filter_global_search')
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr='lte')
    brand = django_filters.CharFilter(method='filter_csv_or_exact', field_name='brand')
    color = django_filters.CharFilter(method='filter_csv_or_exact', field_name='color')
    fit = django_filters.CharFilter(method='filter_csv_or_exact', field_name='fit')
    sleeve = django_filters.CharFilter(method='filter_csv_or_exact', field_name='sleeve')
    gender = django_filters.CharFilter(field_name="gender", lookup_expr='iexact')
    type = django_filters.CharFilter(field_name="type", lookup_expr='iexact')
    category = django_filters.CharFilter(field_name="category__slug", lookup_expr='exact')
    status = django_filters.CharFilter(field_name="status", lookup_expr='exact')
    size = django_filters.CharFilter(method='filter_size')
    offer = django_filters.CharFilter(field_name="offer", lookup_expr='icontains')
    discount = django_filters.CharFilter(field_name="discount", lookup_expr='icontains')

    class Meta:
        model = Product
        fields = ['q', 'brand', 'color', 'fit', 'sleeve', 'gender', 'type', 'category', 'status', 'size', 'offer', 'discount']

    def filter_global_search(self, queryset, name, value):
        if not value or not str(value).strip():
            return queryset
        query = str(value).strip()
        return queryset.filter(
            Q(name__icontains=query) |
            Q(brand__icontains=query) |
            Q(type__icontains=query) |
            Q(color__icontains=query) |
            Q(fit__icontains=query) |
            Q(category__label__icontains=query) |
            Q(category__slug__icontains=query)
        ).distinct()

    def filter_csv_or_exact(self, queryset, name, value):
        if not value:
            return queryset
        values = [v.strip() for v in str(value).split(',') if v.strip()]
        if not values:
            return queryset
        q = Q()
        for val in values:
            q |= Q(**{f"{name}__iexact": val})
        return queryset.filter(q)

    def filter_size(self, queryset, name, value):
        if not value:
            return queryset
        sizes = [s.strip() for s in str(value).split(',') if s.strip()]
        if not sizes:
            return queryset
        q = Q()
        for sz in sizes:
            q |= Q(variants__size__iexact=sz) | Q(size__icontains=sz)
        return queryset.filter(q).distinct()
