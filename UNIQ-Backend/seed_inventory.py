import os
import sys
import uuid
import random
import django


sys.path.append(os.path.dirname(os.path.abspath(__file__)))
if os.path.exists(os.path.join(os.path.dirname(__file__), "config", "settings.py")):
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
else:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from apps.catalog.models import Product, ProductVariant

def seed_inventory():
    print("Checking products and seeding SKU variants...")
    products = Product.objects.filter(is_deleted=False)
    
    total_created = 0
    total_existing = 0

    for product in products:
        sizes = product.size if (isinstance(product.size, list) and len(product.size) > 0) else ["S", "M", "L", "XL"]
        
        clean_name = "".join(filter(str.isalnum, product.name))[:3].upper()
        if not clean_name:
            clean_name = "PRD"

        for size_str in sizes:
            size_clean = str(size_str).strip()
            
            variant, created = ProductVariant.objects.get_or_create(
                product=product,
                size=size_clean,
                color=product.color or '',
                defaults={
                    "sku": f"{clean_name}-{size_clean}-{uuid.uuid4().hex[:4].upper()}",
                    "stock_quantity": random.choices([0, 3, 4, 15, 35, 50], weights=[10, 15, 15, 20, 20, 20])[0],
                    "reserved_quantity": 0,
                }
            )

            if created:
                total_created += 1
            else:
                total_existing += 1

    print("--------------------------------------------------")
    print(f"Inventory Seeding Complete!")
    print(f"• Total Products checked: {products.count()}")
    print(f"• New SKU Variants created: {total_created}")
    print(f"• Existing Variants skipped: {total_existing}")
    print(f"• Total Variants in DB now: {ProductVariant.objects.count()}")
    print("--------------------------------------------------")

if __name__ == "__main__":
    seed_inventory()
