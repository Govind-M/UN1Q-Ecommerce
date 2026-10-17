from rest_framework import permissions

def is_admin_user(user):
    return bool(
        user
        and getattr(user, 'is_authenticated', False)
        and (getattr(user, 'is_staff', False) or getattr(user, 'role', '') == 'admin')
    )

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return is_admin_user(request.user)

class IsAdminUserOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return is_admin_user(request.user)

class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if is_admin_user(request.user):
            return True
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'id'):
            return obj.id == request.user.id
        return False

