# UN1Q E-Commerce Django & DRF Backend

High-performance, production-ready Django REST Framework backend for the UN1Q E-Commerce platform, built according to the modular monolith architecture roadmap.

---

## 🛠️ Stack & Features

- **Framework**: Django 5.x & Django REST Framework (DRF)
- **Database**: PostgreSQL (Production) / SQLite (Development Fallback)
- **Caching & Brokers**: Redis, Celery (Async Jobs for emails & stock cleanup)
- **Authentication**: SimpleJWT (JWT Access & Refresh Token rotation)
- **Payments**: Stripe PaymentIntent Integration with Idempotency Key support
- **State Machine**: Order lifecycle transitions with immutable `OrderEvent` audit log
- **Inventory Concurrency**: Stock reservation with pessimistic locking (`select_for_update`)
- **AI Features**: Hybrid & Semantic Product Search & AI Shopping Assistant chatbot

---

## 🚀 Quick Start (Local Python Virtual Environment)

1. **Activate Virtual Environment**:
   ```bash
   cd uniq-backend
   .\venv\Scripts\activate
   ```

2. **Run Database Migrations**:
   ```bash
   python manage.py migrate
   ```

3. **Seed Database with Initial Mock Data**:
   ```bash
   python seed_db.py
   ```

4. **Start Development Server**:
   ```bash
   python manage.py runserver 8000
   ```
   The backend API will be live at `http://localhost:8000/` and `http://localhost:8000/api/v1/`.

---

## 🐳 Quick Start (Docker Compose)

Run full stack with PostgreSQL, Redis, Celery & Django:
```bash
docker-compose -f docker/docker-compose.yml up --build
```

---

## 🧪 Running Unit & Integration Tests

```bash
python manage.py test tests
```

---

## 📌 API Endpoints Overview

| Category | Endpoint | Method | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `/api/v1/auth/register/` | POST | Register new user account |
| **Auth** | `/api/v1/auth/login/` | POST | JWT Login (returns access + refresh token) |
| **Catalog** | `/api/v1/products` | GET / POST | List/search products, add product (Admin) |
| **Catalog** | `/<category_slug>` | GET | Category products (e.g. `/men_topwear`, `/bags`) |
| **Cart** | `/api/v1/cart` | GET / POST | Manage cart items & merge anonymous cart |
| **Orders** | `/api/v1/orders` | GET / POST | Create order, view history & transition order status |
| **Payments** | `/api/v1/payments/create-intent` | POST | Create Stripe PaymentIntent with Idempotency-Key |
| **Payments** | `/api/v1/payments/webhook` | POST | Stripe webhook signature verification |
| **AI** | `/api/v1/ai/search` | GET | Hybrid & semantic product search |
| **AI** | `/api/v1/ai/assistant` | POST | AI Shopping assistant endpoint |
