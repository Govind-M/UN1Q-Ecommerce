import os
import sys
import json
import django

# Configure Django settings
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
if os.path.exists(os.path.join(os.path.dirname(__file__), "config", "settings.py")):
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
else:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()


from django.contrib.auth import get_user_model
from apps.catalog.models import Category, Product, FilterConfig
from apps.orders.models import Order, OrderItem
from apps.cart.models import Coupon

User = get_user_model()

def seed():
    db_json_path = os.path.join(os.path.dirname(__file__), "..", "db.json")
    if not os.path.exists(db_json_path):
        print("db.json not found at", db_json_path)
        return

    with open(db_json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    print("Seeding Users...")
    users_data = data.get("users", [])
    for u in users_data:
        email = u.get("email", "").strip().lower()
        if not email:
            continue
        if not User.objects.filter(email=email).exists():
            role = u.get("role", "user")
            is_staff = (role == "admin")
            is_superuser = (role == "admin")
            user = User.objects.create_user(
                email=email,
                password=u.get("password", "password123"),
                name=u.get("name", "User"),
                gender=u.get("gender", "prefer_not"),
                role=role,
                is_blocked=u.get("isBlocked", False),
                phone=u.get("phone", ""),
                is_staff=is_staff,
                is_superuser=is_superuser
            )
            print(f"Created user: {user.email}")

    print("Seeding Categories & Products...")
    category_map = {
        "men_topwear": ("Topwear", "men"),
        "men_bottomwear": ("Bottomwear", "men"),
        "men_shoes": ("Shoes", "men"),
        "women_topwear": ("Topwear", "women"),
        "women_bottomwear": ("Bottomwear", "women"),
        "women_shoes": ("Shoes", "women"),
        "bags": ("Bags", "unisex"),
        "caps": ("Caps", "unisex"),
    }

    for cat_slug, (label, gender) in category_map.items():
        cat_obj, _ = Category.objects.get_or_create(
            slug=cat_slug,
            defaults={"label": label, "gender": gender}
        )

        cat_products = data.get(cat_slug, [])
        for p in cat_products:
            name = p.get("name")
            if not name:
                continue
            
            p_id = p.get("id")
            price = p.get("price", 0)
            sizes = p.get("size", [])
            if isinstance(sizes, str):
                sizes = [sizes]

            prod, created = Product.objects.get_or_create(
                name=name,
                category=cat_obj,
                defaults={
                    "type": p.get("type", ""),
                    "brand": p.get("brand", ""),
                    "color": p.get("color", ""),
                    "fit": p.get("fit", ""),
                    "sleeve": p.get("sleeve", ""),
                    "price": price,
                    "discount": p.get("discount"),
                    "offer": p.get("offer"),
                    "image": p.get("image", ""),
                    "gender": p.get("gender", gender),
                    "status": p.get("status", "active"),
                    "size": sizes,
                }
            )
            if created:
                print(f"Created product: {prod.name}")

    print("Seeding Filters...")
    filters_data = data.get("filters", {})
    for key, val in filters_data.items():
        FilterConfig.objects.update_or_create(
            key=key,
            defaults={"values": val}
        )

    print("Seeding Coupons...")
    coupons = [
        {"code": "UN1Q10", "discount_type": "percentage", "discount_value": 10.00, "min_order_value": 500.00, "max_discount_amount": 300.00, "is_active": True},
        {"code": "UN1Q20", "discount_type": "percentage", "discount_value": 20.00, "min_order_value": 1500.00, "max_discount_amount": 500.00, "is_active": True},
        {"code": "FLAT500", "discount_type": "fixed", "discount_value": 500.00, "min_order_value": 2000.00, "max_discount_amount": None, "is_active": True},
    ]
    for c in coupons:
        c_obj, created = Coupon.objects.get_or_create(
            code=c["code"],
            defaults=c
        )
        if created:
            print(f"Created Coupon: {c_obj.code}")

    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed()
