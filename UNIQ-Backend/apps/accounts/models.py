import uuid
from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from common.models import BaseModel

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email address is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)
    
    

class User(AbstractBaseUser, PermissionsMixin, BaseModel):
    ROLE_CHOICES = (
        ('user', 'Customer'),
        ('staff', 'Staff'),
        ('admin', 'Admin'),
    )
    GENDER_CHOICES = (
        ('male', 'Male'),
        ('female', 'Female'),
        ('prefer_not', 'Prefer not to say'),
        ('other', 'Other'),
    )
    email = models.EmailField(unique=True, db_index=True)
    name = models.CharField(max_length=255)
    # When gender is omitted during registration, Django defaults to 'prefer_not' automatically
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, default='prefer_not')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    is_blocked = models.BooleanField(default=False)
    phone = models.CharField(max_length=20, blank=True, default='')
    avatar = models.URLField(blank=True, default='')
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    class Meta:
        ordering = ['-created_at']

    def delete(self, using=None, keep_parents=False):
        self.is_active = False
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_active', 'is_deleted', 'deleted_at', 'updated_at'])

    def __str__(self):
        return f"{self.email} ({self.role})"

    @property
    def isBlocked(self):
        return self.is_blocked

class Address(BaseModel):
    user = models.ForeignKey(User, related_name='addresses', on_delete=models.CASCADE)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    street_address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100, default='India')
    is_default = models.BooleanField(default=False)

    class Meta:
        ordering = ['-is_default', '-created_at']

    def __str__(self):
        return f"{self.full_name}, {self.city} ({self.postal_code})"
