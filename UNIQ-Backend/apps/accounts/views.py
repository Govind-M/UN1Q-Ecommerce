from rest_framework import generics, viewsets, status, filters
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.decorators import action
from rest_framework_simplejwt.views import TokenObtainPairView
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import get_user_model

from .models import Address
from .serializers import (
    UserSerializer, AdminUserSerializer, RegisterSerializer, CustomTokenObtainPairSerializer, AddressSerializer
)
from common.permissions import IsOwnerOrAdmin

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

from common.permissions import IsAdmin

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['role', 'email', 'gender', 'is_blocked']
    search_fields = ['name', 'email']

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAdmin()]

    def create(self, request, *args, **kwargs):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        out_serializer = UserSerializer(user)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'])
    def block(self, request, pk=None):
        user = self.get_object()
        is_blocked = request.data.get('isBlocked', request.data.get('is_blocked', True))
        user.is_blocked = is_blocked
        user.save(update_fields=['is_blocked', 'updated_at'])
        return Response(UserSerializer(user).data)

class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
