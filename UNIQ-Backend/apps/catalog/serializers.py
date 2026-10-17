import uuid
from rest_framework import serializers
from .models import Category, Product, ProductVariant, ProductImage, FilterConfig, InventoryLog

class CategorySerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='slug', read_only=True)

    class Meta:
        model = Category
        fields = ('id', 'slug', 'label', 'gender', 'image')

class ProductVariantSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=False)
    available_stock = serializers.IntegerField(read_only=True)
    sku = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = ProductVariant
        fields = ('id', 'sku', 'size', 'color', 'price_override', 'stock_quantity', 'reserved_quantity', 'available_stock')

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ('id', 'image_url', 'is_primary', 'display_order')

class ProductSerializer(serializers.ModelSerializer):
    categoryId = serializers.CharField(source='category.slug', read_only=True, allow_null=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True, allow_null=True)
    variants = ProductVariantSerializer(many=True, required=False)
    images = ProductImageSerializer(many=True, required=False)

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'type', 'brand', 'color', 'fit', 'sleeve',
            'price', 'discount', 'offer', 'image', 'category', 'categoryId',
            'category_slug', 'gender', 'status', 'size', 'attributes',
            'variants', 'images', 'created_at', 'updated_at'
        )
        extra_kwargs = {
            'price': {'coerce_to_string': False},
            'category': {'read_only': True}
        }

    def _sync_product_size(self, product):
        variant_sizes = list(dict.fromkeys([v.size for v in product.variants.all() if v.size]))
        if variant_sizes:
            product.size = variant_sizes
            product.save(update_fields=['size', 'updated_at'])

    def create(self, validated_data):
        variants_data = validated_data.pop('variants', [])
        images_data = validated_data.pop('images', [])
        product = super().create(validated_data)

        if images_data:
            for img_data in images_data:
                ProductImage.objects.create(product=product, **img_data)

        if variants_data:
            for v_data in variants_data:
                sku = v_data.get('sku')
                if not sku:
                    sku = f"{product.name[:3].upper().replace(' ', '')}-{v_data.get('size', 'OS')}-{uuid.uuid4().hex[:4].upper()}"
                v_data.pop('id', None)
                ProductVariant.objects.create(product=product, sku=sku, **v_data)
        else:
            sizes = product.size if (isinstance(product.size, list) and len(product.size) > 0) else ["M"]
            for size_name in sizes:
                sku = f"{product.name[:3].upper().replace(' ', '')}-{size_name}-{uuid.uuid4().hex[:4].upper()}"
                ProductVariant.objects.create(
                    product=product,
                    sku=sku,
                    size=str(size_name),
                    color=product.color or '',
                    stock_quantity=100
                )

        self._sync_product_size(product)
        return product

    def update(self, instance, validated_data):
        variants_data = validated_data.pop('variants', None)
        images_data = validated_data.pop('images', None)
        product = super().update(instance, validated_data)

        if images_data is not None:
            product.images.all().delete()
            for img_data in images_data:
                img_data.pop('id', None)
                ProductImage.objects.create(product=product, **img_data)

        if variants_data is not None:
            for v_data in variants_data:
                v_id = v_data.get('id')
                if v_id and ProductVariant.objects.filter(id=v_id, product=product).exists():
                    v_item = ProductVariant.objects.get(id=v_id, product=product)
                    for k, v in v_data.items():
                        if k != 'id':
                            setattr(v_item, k, v)
                    v_item.save()
                else:
                    sku = v_data.get('sku') or f"{product.name[:3].upper().replace(' ', '')}-{v_data.get('size', 'OS')}-{uuid.uuid4().hex[:4].upper()}"
                    v_data.pop('id', None)
                    ProductVariant.objects.create(product=product, sku=sku, **v_data)

        self._sync_product_size(product)
        return product

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['id'] = str(instance.id)
        if instance.category:
            ret['category'] = instance.category.label
            ret['categoryId'] = instance.category.slug
        return ret


class InventorySerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.URLField(source='product.image', read_only=True)
    category_label = serializers.CharField(source='product.category.label', default='General', read_only=True)
    available_stock = serializers.IntegerField(read_only=True)

    class Meta:
        model = ProductVariant
        fields = (
            'id', 'sku', 'size', 'color',
            'product_name', 'product_image', 'category_label',
            'stock_quantity', 'reserved_quantity', 'available_stock',
            'updated_at'
        )
        read_only_fields = ('id', 'sku', 'size', 'color', 'reserved_quantity', 'updated_at')

    def validate_stock_quantity(self, value):
        if self.instance and value < self.instance.reserved_quantity:
            raise serializers.ValidationError(
                f"Cannot set stock below currently reserved units ({self.instance.reserved_quantity})."
            )
        return value

