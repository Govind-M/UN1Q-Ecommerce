from .base import * 

DEBUG = True

SECRET_KEY = env('SECRET_KEY', default='dev-only-insecure-key-never-use-in-production')  



ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1', '*'])  



DATABASES = {
    "default": env.db("DATABASE_URL")
}



REDIS_URL = env('REDIS_URL', default='') 



if REDIS_URL:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': REDIS_URL,
        }
    }
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        }
    }




STORAGES = {
    'default': {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
    },
    'staticfiles': {
        'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage',
    },
}




CELERY_BROKER_URL = env('CELERY_BROKER_URL', default='redis://127.0.0.1:6379/0')  
CELERY_RESULT_BACKEND = env('REDIS_URL', default='redis://127.0.0.1:6379/1')  



EMAIL_BACKEND = env(
    'EMAIL_BACKEND',
    default='django.core.mail.backends.console.EmailBackend'
)



CORS_ALLOW_ALL_ORIGINS = True



RAZORPAY_MOCK_MODE = env.bool('RAZORPAY_MOCK_MODE', default=False) 
