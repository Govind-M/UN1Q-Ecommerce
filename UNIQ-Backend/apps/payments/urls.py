from django.urls import path
from .views import (
    CreateRazorpayOrderView,
    VerifyRazorpayPaymentView,
)

urlpatterns = [
    path('razorpay/create-order/', CreateRazorpayOrderView.as_view(), name='create_razorpay_order_slash'),
    path('razorpay/verify/', VerifyRazorpayPaymentView.as_view(), name='verify_razorpay_payment_slash'),
]
