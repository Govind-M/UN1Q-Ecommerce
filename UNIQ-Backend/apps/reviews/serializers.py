from rest_framework import serializers
from .models import Review, ReviewSummary

class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)

    class Meta:
        model = Review
        fields = ('id', 'user', 'user_name', 'product', 'rating', 'title', 'comment', 'is_verified_purchase', 'created_at')
        read_only_fields = ('id', 'user', 'is_verified_purchase', 'created_at')

    def update(self, instance, validated_data):
        validated_data.pop('product', None)
        validated_data.pop('user', None)
        return super().update(instance, validated_data)

class ReviewSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewSummary
        fields = ('id', 'product', 'summary_text', 'average_rating', 'total_reviews', 'created_at', 'updated_at')
