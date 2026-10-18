import os
from pathlib import Path
from datetime import timedelta
import environ
from celery.schedules import crontab
from corsheaders.defaults import default_headers


BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env()
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))


ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=[])

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'drf_spectacular',

    'common',
    'apps.accounts',
    'apps.catalog',
    'apps.cart',
    'apps.orders',
    'apps.payments',
    'apps.reviews',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'common.middleware.RequestIDMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

AUTH_USER_MODEL = 'accounts.User'

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True




STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'




API_PAGINATE = env.bool('API_PAGINATE', default=False)
ENABLE_LEGACY_ROOT_ROUTES = env.bool('ENABLE_LEGACY_ROOT_ROUTES', default=True)

REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'apps.accounts.authentication.CustomJWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_THROTTLE_CLASSES': (
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ),
    'DEFAULT_THROTTLE_RATES': {
        'anon': '120/min',
        'user': '600/min',
        'login': '10/min',
        'register': '5/min',
        'coupon': '20/min',
        'payments': '30/min',
    },
}

if API_PAGINATE:
    REST_FRAMEWORK['DEFAULT_PAGINATION_CLASS'] = 'common.pagination.StandardResultsSetPagination'


# ---------------------------------------------------------------------------
# DRF SPECTACULAR (API DOCS)
# ---------------------------------------------------------------------------
SPECTACULAR_SETTINGS = {
    'TITLE': 'UN1Q E-Commerce API',
    'DESCRIPTION': (
        'Complete REST API documentation for UN1Q E-Commerce platform '
        'including authentication, catalog, cart, orders, and payments.'
    ),
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
}



# ---------------------------------------------------------------------------
# SIMPLE JWT
# ---------------------------------------------------------------------------
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=env.int('ACCESS_TOKEN_MINUTES', default=60)),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}



# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
CORS_ALLOW_ALL_ORIGINS = False

CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[])

CORS_ALLOW_HEADERS = list(default_headers) + [
    'x-cart-token',
    'idempotency-key',
    'x-request-id',
]
CORS_EXPOSE_HEADERS = ['X-Request-ID']

CSRF_TRUSTED_ORIGINS = env.list('CSRF_TRUSTED_ORIGINS', default=[])



# ---------------------------------------------------------------------------
# BUSINESS SETTINGS
# ---------------------------------------------------------------------------
CART_MAX_QTY_PER_ITEM = env.int('CART_MAX_QTY_PER_ITEM', default=10)
ORDER_PAYMENT_WINDOW_MINUTES = env.int('ORDER_PAYMENT_WINDOW_MINUTES', default=30)
SHIPPING_FLAT_FEE = env('SHIPPING_FLAT_FEE', default='0')
FREE_SHIPPING_THRESHOLD = env('FREE_SHIPPING_THRESHOLD', default='0')



# ---------------------------------------------------------------------------
# RAZORPAY
# ---------------------------------------------------------------------------
RAZORPAY_KEY_ID = env('RAZORPAY_KEY_ID', default='')
RAZORPAY_KEY_SECRET = env('RAZORPAY_KEY_SECRET', default='')
RAZORPAY_MOCK_MODE = env.bool('RAZORPAY_MOCK_MODE', default=False)



# ---------------------------------------------------------------------------
# EMAIL
# ---------------------------------------------------------------------------
EMAIL_BACKEND = env(
    'EMAIL_BACKEND',
    default='django.core.mail.backends.smtp.EmailBackend',
)
EMAIL_HOST = env('EMAIL_HOST', default='')
EMAIL_PORT = env.int('EMAIL_PORT', default=587)
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')
EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=True)
EMAIL_USE_SSL = env.bool('EMAIL_USE_SSL', default=False)
DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default='UN1Q Store <noreply@uniq.com>')
EMAIL_TIMEOUT = 10




# ---------------------------------------------------------------------------
# CELERY
# ---------------------------------------------------------------------------
REDIS_URL = env('REDIS_URL', default='')

CELERY_BROKER_URL = env('CELERY_BROKER_URL', default=REDIS_URL or 'redis://localhost:6379/0')
CELERY_TASK_ALWAYS_EAGER = env.bool('CELERY_ALWAYS_EAGER', default=False)
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True
CELERY_TASK_ACKS_LATE = True
CELERY_TASK_TIME_LIMIT = 120
CELERY_TIMEZONE = TIME_ZONE

CELERY_BEAT_SCHEDULE = {
    'cancel-expired-pending-orders': {
        'task': 'apps.orders.tasks.cancel_expired_pending_orders',
        'schedule': 300.0,
    },
    'release-expired-stock-reservations': {
        'task': 'apps.cart.tasks.cleanup_expired_stock_reservations',
        'schedule': 300.0,
    },
    'purge-stale-guest-carts': {
        'task': 'apps.cart.tasks.purge_stale_guest_carts',
        'schedule': crontab(hour=2, minute=0),
    },
    'reconcile-stock-reservations': {
        'task': 'apps.cart.tasks.reconcile_stock_reservations',
        'schedule': crontab(hour=2, minute=30),
    },
    'purge-idempotency-records': {
        'task': 'apps.payments.tasks.purge_old_idempotency_records',
        'schedule': crontab(hour=3, minute=0),
    },
}
