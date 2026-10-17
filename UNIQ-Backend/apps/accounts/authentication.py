from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed

class CustomJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        if user:
            if getattr(user, 'is_blocked', False):
                raise AuthenticationFailed('Account is blocked by administrator.')
            if not getattr(user, 'is_active', True) or getattr(user, 'is_deleted', False):
                raise AuthenticationFailed('Account is inactive or has been deleted.')
        return user
