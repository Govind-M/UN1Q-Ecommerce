from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from .models import Address

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    isBlocked = serializers.BooleanField(source='is_blocked', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = User
        fields = ('id', 'name', 'email', 'gender', 'role', 'isBlocked', 'is_blocked', 'phone', 'avatar', 'created_at', 'createdAt')
        read_only_fields = ('id', 'created_at', 'role', 'is_blocked', 'isBlocked', 'createdAt')

class AdminUserSerializer(serializers.ModelSerializer):
    isBlocked = serializers.BooleanField(source='is_blocked', required=False)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = User
        fields = ('id', 'name', 'email', 'gender', 'role', 'isBlocked', 'is_blocked', 'phone', 'avatar', 'created_at', 'createdAt')
        read_only_fields = ('id', 'created_at', 'createdAt')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ('id', 'name', 'email', 'password', 'gender', 'role', 'phone', 'avatar')
        read_only_fields = ('id', 'role')

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data['role'] = 'user'
        user = User.objects.create_user(password=password, **validated_data)
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        if self.user.is_blocked:
            raise serializers.ValidationError({
                'code': 'ACCOUNT_BLOCKED',
                'message': 'Your account has been suspended. Please contact support if you believe this is an error.',
            })
        user_serializer = UserSerializer(self.user)
        data['user'] = user_serializer.data
        return data

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = '__all__'
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')
