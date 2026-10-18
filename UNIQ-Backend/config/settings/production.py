import ssl
from .base import * 

DEBUG = False


SECRET_KEY = env('SECRET_KEY') 

ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=[])  


DATABASES = {
    'default': env.db('DATABASE_URL')  
}


REDIS_URL = env('REDIS_URL')  

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': REDIS_URL,
    }
}


USE_S3 = env.bool('USE_S3', default=False)  

if USE_S3:
    STORAGES = {
        'default': {
            'BACKEND': 'storages.backends.s3.S3Storage',
            'OPTIONS': {
                'bucket_name': env('AWS_STORAGE_BUCKET_NAME'),
                'region_name': env('AWS_S3_REGION_NAME'),
                'location': 'media',
                'file_overwrite': False,
                'querystring_auth': True,
                'querystring_expire': 3600,
            },
        },
        'staticfiles': {
            'BACKEND': (
                'whitenoise.storage.'
                'CompressedManifestStaticFilesStorage'
            ),
        },
    }
else:
    STORAGES = {
        'default': {
            'BACKEND': 'django.core.files.storage.FileSystemStorage',
        },
        'staticfiles': {
            'BACKEND': (
                'whitenoise.storage.'
                'CompressedManifestStaticFilesStorage'
            ),
        },
    }


CELERY_BROKER_URL = env('CELERY_BROKER_URL', default=REDIS_URL)
CELERY_RESULT_BACKEND = env('CELERY_RESULT_BACKEND', default=REDIS_URL)


CELERY_BROKER_USE_SSL = {'ssl_cert_reqs': ssl.CERT_NONE}
CELERY_REDIS_BACKEND_USE_SSL = {'ssl_cert_reqs': ssl.CERT_NONE}


SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = env.bool('DJANGO_SECURE_SSL_REDIRECT', default=True)  
SECURE_HSTS_SECONDS = 31536000          
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
X_FRAME_OPTIONS = 'DENY'


EMAIL_BACKEND = env(
    'EMAIL_BACKEND',
    default='django.core.mail.backends.smtp.EmailBackend',
)


CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[])  # noqa: F405


RAZORPAY_KEY_ID = env('RAZORPAY_KEY_ID')  
RAZORPAY_KEY_SECRET = env('RAZORPAY_KEY_SECRET')  
RAZORPAY_MOCK_MODE = False




