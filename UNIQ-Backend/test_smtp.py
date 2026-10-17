import os
import sys
import django

# Setup Django Environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.core.mail import send_mail
from django.conf import settings

def test_smtp(recipient):
    print("--------------------------------------------------")
    print("Testing UN1Q SMTP Service...")
    print(f"• Host: {settings.EMAIL_HOST}:{settings.EMAIL_PORT}")
    print(f"• User: {settings.EMAIL_HOST_USER}")
    print(f"• Destination: {recipient}")
    print("--------------------------------------------------")

    try:
        send_mail(
            subject="UN1Q Test Email - SMTP Verified!",
            message="Your SMTP configuration is working perfectly.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=False,
        )
        print("✓ SUCCESS: Test email sent! Check your inbox.")
    except Exception as e:
        print(f"✗ ERROR: {str(e)}")

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "your_personal_email@gmail.com"
    test_smtp(target)
