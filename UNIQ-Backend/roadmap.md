E-Commerce Backend ��� Full Implementation Roadmap
UNIQ-Backend Project
Table of Contents
TOC \o "1-2" \h \z \u
E-Commerce Backend — Full Implementation Roadmap
Senior Backend Architect & Engineering Mentor Guide
Stack: Django · DRF · PostgreSQL · Redis · Celery · SimpleJWT | Pattern: Modular Monolith | Python: 3.12+
Assumptions
Before reading this roadmap, note the key assumptions made about your context and how they shape the recommendations:
You know Python well enough to write classes, functions, and basic OOP — Django will feel approachable.
You have built the React frontend and understand REST roughly — API design explanations will be conceptual, not from scratch.
This is a portfolio + learning project, not a live business. Simplifications are acceptable where they don’t compromise the learning signal.
You are targeting backend/full-stack roles, so the roadmap prioritises skills that show up in interviews and job descriptions.
Material assumption: You are not starting with microservices. A well-structured modular monolith is recommended. If you had a team of 5+ engineers and separate deployment velocity requirements, decomposition would make sense; here it would just add operational overhead with no proportional learning benefit.
Redis, Celery, and PostgreSQL are all deployable locally via Docker Compose.
Section 1: Backend Foundation & Stack
Recommended Stack
Django + Django REST Framework (DRF) Django gives you the ORM, migrations, admin, and auth out of the box — meaning you spend time on system design rather than plumbing. DRF adds serializers, viewsets, routers, and permission classes that directly mirror patterns used in production Django shops. The patterns you learn (serializers as contracts, permission classes as middleware, signals for side effects) transfer directly to real codebases.
PostgreSQL The industry-default relational database. You’ll use JSON columns for flexible product attributes, full-text search for product search, and window functions for analytics — none of which SQLite can do. Migrations will be real schema management, not file resets.
Redis Used for: session storage, cart caching, rate limiting counters, Celery broker, and idempotency keys. One tool, five production patterns — very high learning ROI.
Celery + Redis as broker Async task queue for sending emails, processing webhooks, generating reports, and background inventory updates. This is how every production Django app handles work that shouldn’t block the HTTP response.
SimpleJWT for authentication JWT access + refresh token pattern. You’ll implement token rotation, blacklisting on logout, and per-device token invalidation — all real-world concerns.
Django Storages + boto3 (Phase 6) File/image storage to S3 or compatible object store. Learn storage abstraction without coupling your code to a specific provider.
Project Architecture
Use a modular monolith — one codebase, one deployment, but apps organised as isolated modules with clean boundaries. The discipline of keeping apps from importing each other’s models directly is the same discipline required in microservices, but without the operational overhead.
REST API Design Principles
Use resource-based URLs: /api/v1/products/, /api/v1/orders/{id}/
Nest sparingly: /api/v1/orders/{id}/items/ is fine; deeper is usually a sign of wrong abstraction
Use HTTP verbs correctly: GET for reads, POST for creates, PATCH for partial updates, DELETE for deletes
Version the API from day one: /api/v1/ as a URL prefix
Return consistent envelope: {"data": ..., "meta": {...}, "errors": [...]}
Use 201 for creates, 204 for deletes, 400 for validation errors, 401 for unauthenticated, 403 for unauthorised, 404 for not found, 409 for conflicts, 422 for semantic errors
Authentication & Authorisation
JWT: short-lived access tokens (15 min), long-lived refresh tokens (7 days), stored in httpOnly cookies to prevent XSS theft
RBAC: three roles minimum — customer, staff, admin. Use Django’s built-in groups + custom permission classes in DRF
Object-level permissions: a customer can only read their own orders. Implement via DRF’s IsOwnerOrAdmin custom permission class
Token blacklisting on logout: store invalidated refresh token JTIs in Redis with TTL matching the token expiry
Database Design Principles
Use UUIDs as primary keys for any externally exposed resource (prevents enumeration attacks)
Add created_at, updated_at on every model via an abstract base class
Index foreign keys, filter columns (status, is_active), and any column used in ORDER BY
Use select_for_update() inside transactions when modifying inventory to prevent race conditions
Never delete business data — use soft delete (is_deleted flag + deleted_at timestamp)
Run all multi-step mutations inside transaction.atomic()
Validation, Error Handling & Logging
Validate at the serializer layer (DRF serializers) — never trust raw request data
Add a global exception handler in DRF to return consistent error envelopes
Use Python’s logging module with structured output (JSON via python-json-logger) — every request gets a request_id header that appears in all logs
Use django-environ for configuration — never hardcode secrets
Section 2: Real-World E-Commerce Functionality
Product & Catalog Management
Products have variants (size/colour), categories, images, and attributes that differ per category. A rigid schema breaks down — the solution is a combination of structured fields and a JSON attributes column per product.
Build: Product → ProductVariant (SKU, price, stock) → Category (tree structure) → ProductImage. Use a JSONB attributes column for flexible specs. Skip: Full EAV (Entity-Attribute-Value) — it’s overkill and hard to query.
Search, Filtering, Sorting & Pagination
Build now: PostgreSQL full-text search using SearchVector + SearchQuery. Add django-filter for filter params (price range, category, attributes). Use cursor-based pagination — offset pagination fails at scale because OFFSET 10000 is slow.
Build later: Elasticsearch or Typesense for faceted search, typo-tolerance, and relevance tuning. Phase 7 upgrade, not Phase 1.
Inventory & Stock Reservation
The real problem: Two users add the last item to their cart simultaneously — who gets it? A naive stock -= 1 fails under concurrency.
Build: When an item is added to cart, reserve the stock (decrement reserved_quantity) with a TTL — if checkout doesn’t complete within 15 minutes, a Celery periodic task releases the reservation. On order completion, decrement quantity and clear the reservation. This uses select_for_update() + transaction.atomic().
Cart & Checkout
Cart is session-backed for anonymous users (stored in Redis) and DB-backed for authenticated users. On login, merge the anonymous cart into the user’s DB cart. Checkout is a multi-step process: validate cart items are still in stock → apply coupon → calculate shipping → create PaymentIntent → confirm order.
Orders & Order Lifecycle
Orders have a state machine: pending → confirmed → processing → shipped → delivered → completed (and cancelled, refund_requested, refunded branches). Implement with a status field + transition validation — only allowed transitions can be applied. Each transition is logged to an OrderEvent table (immutable audit log).
Coupons, Discounts & Pricing Rules
Build: A Coupon model with type (percentage, fixed), min order value, usage limit, per-user limit, and expiry. Apply at checkout only — never store discounted prices in the cart. Skip: Complex promotion engines (buy-two-get-one, bundle pricing) — these require significant domain logic and are portfolio overkill.
Payments & Webhooks
Use Razorpay (test mode). Flow: POST /api/v1/payments/create-order → create Razorpay Order → return razorpay_order_id & key_id to frontend → frontend confirms → Razorpay sends webhook or verify endpoint confirms → backend processes event. This is the most interview-valuable flow to implement correctly — it touches idempotency, async processing, and webhook security (verify Razorpay signature).
Refunds & Cancellations
Order cancellation before shipment: reverse stock reservation, issue refund via Razorpay API, transition order to cancelled. After shipment: initiate return flow. Refunds are processed via Celery task (async) and tracked with a Refund model.
Notifications & Email
Use Celery tasks to send email asynchronously. Use django-anymail with SendGrid (free tier). Emails: order confirmation, shipping update, password reset, account verification. Key pattern: never send email in the HTTP request cycle.
Reviews & Ratings
One review per user per product (enforced by unique constraint). Aggregate rating computed via a DB view or cached on the Product model and updated on each review create/update. Include verified-purchase check (only users who completed an order for the product can review).
Admin Functionality
Django’s built-in admin covers 80% of needs. Customise with list_display, list_filter, search_fields, and custom actions. Add a separate admin-only API endpoint set for operations that require explicit RBAC.
Audit Logs
Use a custom AuditLog model or django-simple-history. Every state change to an Order or critical entity records: who changed it, what changed, when. This is non-negotiable in real systems and excellent interview material.
Security & Abuse Prevention
Rate limiting: django-ratelimit on login, registration, and checkout endpoints
CORS: configure django-cors-headers to only allow your frontend origin
Input validation: DRF serializers + explicit field max lengths
SQL injection: not possible if you use the ORM correctly (parameterised queries by default)
HTTPS: enforce via SECURE_SSL_REDIRECT in production settings
Section 3: Advanced Backend / System Design
Must Learn Now (Phases 1–5)
Database Transactions & Concurrency Implement stock reservation using select_for_update() + transaction.atomic(). This is one of the most common backend interview questions and a real bug if you get it wrong. You’ll understand pessimistic locking, race conditions, and when optimistic vs pessimistic locking makes sense.
Idempotency Payment endpoints must be idempotent — a network retry shouldn’t charge the user twice. Implement via: client sends Idempotency-Key header → server stores (key → response) in Redis with TTL → on duplicate request, return cached response without re-executing. This pattern appears in every payment, order creation, and webhook handler at scale.
Background Jobs with Celery Implement: email sending, stock reservation expiry cleanup, order status sync. You’ll learn task serialisation, retry logic with exponential backoff, task routing to different queues, and monitoring via Flower.
Redis Caching Cache product listings, category trees, and product detail pages. Use cache invalidation on product update (hard part). Implement with Django’s cache framework using Redis backend. You’ll learn TTL strategy, cache stampede prevention, and when caching hurts more than it helps.
Rate Limiting Implement per-IP and per-user rate limits using Redis counters with sliding window algorithm. Apply to auth endpoints, search, and checkout. This teaches you about distributed counters and why a naive in-memory counter fails with multiple processes.
Learn Later (Phases 6–8)
Event-Driven Architecture Instead of calling the notification service directly after order creation, publish an order.created event to a queue. Multiple consumers (email, inventory, analytics) react independently. Implement with Celery signals or Redis Streams. This is Phase 8 territory — don’t add this until your synchronous system is solid.
Docker & Docker Compose Containerise your app, Postgres, Redis, and Celery. The docker-compose.yml becomes your development environment specification — any developer can run the stack with one command.
Observability Structured JSON logging + Sentry for error tracking (free tier) + basic health check endpoint (/health/). Skip Prometheus/Grafana for now — that’s infrastructure-engineer territory.
Testing Strategy Unit test serialisers and model methods. Integration test API endpoints using DRF’s APITestCase. Mock external APIs (Stripe, email) with unittest.mock. Aim for 70% coverage on critical paths (auth, orders, payments). Use factory_boy for test data.
CI/CD GitHub Actions: on every PR, run tests + linter (ruff) + type checker (mypy). On merge to main, build Docker image + deploy to cloud.
Section 4: AI Features for Modern E-Commerce
AI Feature
What You Learn
Level
Build When
Semantic Product Search
Embeddings, vector databases, cosine similarity, RAG fundamentals
Intermediate
Phase 7
AI Shopping Assistant
RAG, tool use, conversation state, LLM APIs
Intermediate
Phase 7
Product Description Generation
Prompt engineering, structured output, LLM integration
Beginner
Phase 7
Review Summarisation
Summarisation, sentiment analysis, structured extraction
Beginner
Phase 7
Similar Product Recommendations
Embeddings, similarity search, content-based filtering
Intermediate
Phase 7
Customer Support Assistant (RAG)
RAG pipeline, retrieval, chunking, grounding
Intermediate
Phase 8
Personalised Recommendations
Collaborative filtering, user behaviour modelling
Advanced
Phase 8
Fraud Detection
Anomaly detection, feature engineering, rule engines
Advanced
Phase 8
AI Admin Analytics (NL-to-SQL)
NLP-to-SQL, text-to-query, LLM tool use
Intermediate
Phase 8
Demand Forecasting
Time series, Prophet, feature engineering
Advanced
Skip
Phase 7 AI Architecture — What to Actually Build
Install pgvector in PostgreSQL Add the pgvector extension to Postgres. Add a embedding vector(1536) column to your Product model. Write a Celery task that runs on product save, calls the embedding API, and stores the result. This gives you a queryable vector store with zero extra infrastructure.
Semantic Search Endpoint GET /api/v1/search/?q=waterproof+hiking+shoes — embed the query, run a cosine_distance query via pgvector, return top-K results ranked by similarity. Combine with keyword search (PostgreSQL FTS) for hybrid search. This is the pattern used by most production semantic search systems.
Shopping Assistant POST /api/v1/assistant/chat/ — accepts conversation history, uses function calling to query your product search endpoint, returns LLM response streamed via SSE. No separate vector DB needed — your pgvector setup handles retrieval.
Section 5: Career-Oriented Skills Map
Skills marked [CORE] are commonly required or strongly valued in backend/full-stack job descriptions. Skills marked [OPTIONAL] are specialisation areas.
Backend Development
[CORE] Django / DRF
[CORE] REST API design
[CORE] Authentication (JWT, OAuth2)
[CORE] Background jobs (Celery)
[CORE] Async patterns
Databases
[CORE] PostgreSQL schema design
[CORE] Indexing strategy
[CORE] Transactions / ACID
[CORE] Migrations
[OPTIONAL] pgvector (AI workloads)
API Design
[CORE] Resource modelling
[CORE] Versioning
[CORE] Pagination strategies
[CORE] Error envelope design
[OPTIONAL] GraphQL
System Design
[CORE] Caching (Redis)
[CORE] Message queues
[CORE] Idempotency
[CORE] Concurrency & locking
[OPTIONAL] Event-driven architecture
Security
[CORE] RBAC / permissions
[CORE] Rate limiting
[CORE] Input validation
[CORE] HTTPS / security headers
[OPTIONAL] OAuth2 provider
Cloud / DevOps
[CORE] Docker / Compose
[CORE] CI/CD (GitHub Actions)
[CORE] Environment config (12-factor)
[OPTIONAL] Cloud deployment (AWS/GCP)
[OPTIONAL] IaC (Terraform)
Testing
[CORE] API integration tests
[CORE] Unit tests + mocking
[CORE] Test data factories
[OPTIONAL] Load testing
[OPTIONAL] Contract testing
AI Engineering
[CORE] LLM API integration
[CORE] Embeddings & vector search
[CORE] RAG pipelines
[OPTIONAL] Fine-tuning
[OPTIONAL] Agent orchestration
Section 6: Implementation Roadmap
Phase 0 — Architecture & Database Design
Before writing a single endpoint — get this right or pay for it every phase.
Deliverables - ER diagram for all models - Django project + app structure - docker-compose.yml (Postgres + Redis) - Base model with UUID PK, timestamps - Environment config via .env
Concepts Learned - Django project anatomy - Schema design & normalisation - Docker Compose basics - 12-factor app config
Definition of Done You can run docker compose up -d and connect to Postgres. All migrations run. ER diagram is reviewed and finalised.
Skip for now: Any API endpoints, authentication, business logic.
Phase 1 — Core Backend: Accounts & User Model
Always define AUTH_USER_MODEL before the first migration. This cannot be changed later without resetting the database.
APIs to Build - Register / login / logout - Access + refresh token flow - Password reset (email + token) - Email verification - Profile CRUD (own profile only) - Address management
Concepts Learned - JWT access/refresh pattern - httpOnly cookie storage - Token blacklisting in Redis - DRF custom permission classes - Django groups & RBAC - Email via Celery (async)
Definition of Done Users can register, verify email, log in, and get a fresh access token via refresh. Admin-only endpoints reject customer tokens with 403. Logout blacklists the refresh token.
Skip for now: OAuth2 social login, 2FA/MFA, device management.
Phase 2 — Core Backend: Catalog
APIs to Build - Product list/detail/create/update/delete - Category CRUD - Product variants & images - Filtering, sorting, pagination - PostgreSQL full-text search
Concepts Learned - DRF serialisers, ViewSets, Routers - django-filter - Cursor pagination - PostgreSQL FTS with SearchVector - Image upload handling
Definition of Done React frontend renders products from your real API. You can filter and search. Admin can add products via the API. Soft delete works. All endpoints have tests.
Phase 3 — Cart, Wishlist & Checkout
APIs to Build - Cart CRUD (anonymous + authenticated) - Cart merge on login - Wishlist CRUD - Coupon apply/remove - Stock reservation on add-to-cart
Concepts Learned - Redis session-backed anonymous cart - DB transactions for stock reservation - select_for_update() - Celery periodic task for TTL cleanup - Coupon validation logic
Testing Required - Concurrent add-to-cart test - Reservation expiry test - Coupon edge cases - Cart merge correctness
Definition of Done Anonymous cart works. Auth cart persists. Stock reservation prevents overselling under simulated concurrent requests. Coupons validate correctly.
Phase 4 — Orders, Payments & Inventory
The most technically complex phase — and the most interview-valuable.
APIs to Build - Order creation from cart - Order state machine - Stripe PaymentIntent creation - Stripe webhook handler - Refund endpoint - Order history/detail - Idempotency on payment endpoint
Concepts Learned - State machine patterns - Webhook security (signature verification) - Idempotency key pattern (Redis) - Immutable audit log (OrderEvent) - Async Celery tasks for email - Stripe test mode integration
Definition of Done Full order-to-payment flow works end-to-end with Stripe test cards. Webhook confirms payment and transitions order. Duplicate payment requests are idempotent. Order events log every state change.
Skip for now: Real shipping API integration, complex refund workflows, tax calculation.
Phase 5 — Production Engineering
Features to Build - Redis caching for product listings - Cache invalidation on product update - Rate limiting on auth + checkout - Reviews & ratings (verified purchase) - Global exception handler - Request ID middleware - Structured JSON logging - Sentry integration
Concepts Learned - Cache invalidation strategies - Sliding window rate limiting - Structured logging in production - Error tracking / alerting - Django signals for side effects
Definition of Done Product list endpoint hits Redis on second request. Auth endpoint returns 429 after 5 failed attempts in 1 minute. All errors return consistent JSON. Sentry captures unhandled exceptions.
Phase 6 — Cloud & DevOps
Deliverables - Production Dockerfile (multi-stage) - docker-compose for dev + prod - GitHub Actions: test + lint CI - GitHub Actions: build + deploy CD - S3 (or Cloudflare R2) for media files - Deploy to Railway / Render / EC2 - Environment secrets management
Concepts Learned - Multi-stage Docker builds - CI/CD pipeline design - Object storage abstraction - Secrets in CI environments - Production Django settings
Definition of Done Live URL exists. PR triggers test run. Merge to main triggers deployment. Media files served from S3. No secrets in git.
Skip for now: Kubernetes, Terraform/IaC.
Phase 7 — AI Features
Features to Build - pgvector setup in Postgres - Product embedding pipeline (Celery) - Semantic search endpoint - Hybrid search (FTS + vector) - Similar products endpoint - AI shopping assistant (SSE stream) - Review summarisation (Celery task) - Product description generation (admin)
Concepts Learned - Text embeddings & vector math - pgvector cosine similarity queries - Hybrid retrieval strategies - LLM function calling / tool use - Server-Sent Events (SSE) streaming - RAG architecture
Definition of Done Semantic search returns meaningfully different results than keyword search. Shopping assistant answers product questions using your catalog. Review summaries appear on products with 10+ reviews.
Skip: Fine-tuning any model, training custom embeddings, ML model serving infrastructure.
Phase 8 — Advanced System Design (Pick 1–2)
Options (choose what aligns with your target role):
Event-driven order processing (Redis Streams) → targets distributed systems roles
Elasticsearch / Typesense for faceted search → targets data-intensive application roles
Natural-language admin analytics (NL-to-SQL) → targets AI engineering roles
Customer support RAG → targets AI engineering roles
A/B testing framework for search ranking → targets product engineering roles
Section 7: Project Repository Structure
ecommerce-backend/├── apps/│   ├── accounts/           # User model, auth, JWT, addresses│   │   ├── models.py│   │   ├── serializers.py│   │   ├── views.py│   │   ├── urls.py│   │   ├── permissions.py│   │   └── tasks.py        # Celery: send verification email│   ├── catalog/            # Products, categories, variants, images│   │   ├── models.py│   │   ├── serializers.py│   │   ├── views.py│   │   ├── urls.py│   │   ├── filters.py      # django-filter FilterSet│   │   ├── signals.py      # Cache invalidation + embedding trigger│   │   └── tasks.py        # Celery: generate embeddings on product save│   ├── cart/               # Cart (anon + auth), wishlist, coupons│   │   ├── models.py│   │   ├── serializers.py│   │   ├── views.py│   │   ├── urls.py│   │   ├── services.py     # CartService — merge, validate, reserve stock│   │   └── tasks.py        # Celery: release expired reservations│   ├── orders/             # Order, OrderItem, OrderEvent, Refund│   │   ├── models.py│   │   ├── serializers.py│   │   ├── views.py│   │   ├── urls.py│   │   ├── services.py     # OrderService — create from cart│   │   └── tasks.py        # Celery: send confirmation email│   ├── payments/           # Stripe integration, webhook handler│   │   ├── models.py       # Payment, idempotency records│   │   ├── views.py│   │   ├── urls.py│   │   └── webhooks.py     # Stripe webhook dispatcher│   ├── reviews/            # Review, Rating, ReviewSummary│   │   └── tasks.py        # Celery: trigger AI summarisation│   └── ai_features/        # AI features (Phase 7)│       ├── embeddings.py   # OpenAI/sentence-transformers wrapper│       ├── search.py       # Hybrid search orchestration│       ├── assistant.py    # Shopping assistant + function calling│       └── views.py        # SSE streaming endpoint├── common/                 # Shared utilities across apps│   ├── models.py           # BaseModel with UUID PK, timestamps, soft delete│   ├── exceptions.py       # Custom exceptions + DRF exception handler│   ├── pagination.py       # Cursor pagination class│   ├── middleware.py       # Request ID injection│   └── permissions.py     # Shared permission helpers├── config/│   ├── settings/│   │   ├── base.py         # Shared settings│   │   ├── development.py  # Dev overrides│   │   └── production.py   # Prod (HTTPS, S3, Sentry)│   ├── urls.py             # Root URL config│   ├── celery.py           # Celery app initialisation│   └── wsgi.py├── tests/                  # Mirrors apps/ structure│   ├── factories.py        # factory_boy factories for all models│   ├── accounts/│   ├── catalog/│   ├── cart/│   ├── orders/│   └── payments/├── docker/│   ├── Dockerfile│   └── docker-compose.yml├── .github/workflows/│   ├── ci.yml              # Run tests + lint on PR│   └── deploy.yml          # Build + deploy on main merge├── requirements/│   ├── base.txt│   ├── development.txt│   └── production.txt└── manage.py
Why this structure? Each app owns its models, serialisers, views, URLs, and tasks — this is the “module boundary” discipline that keeps a monolith maintainable. common/ holds only genuinely shared infrastructure, not business logic. The services.py pattern (e.g., CartService) extracts complex business logic from views, making it independently testable.
Section 8: Portfolio & Interview Value
1. Stock Reservation with select_for_update
Engineering Problem: Concurrent Inventory When two users attempt to buy the last item simultaneously, a naive stock -= 1 allows overselling. You implement pessimistic locking: select_for_update() acquires a row-level lock before reading inventory, ensuring serialised access. Combined with transaction.atomic(), only one transaction succeeds.
Trade-off you can explain: Pessimistic locking reduces throughput under high contention but guarantees correctness. Optimistic locking (version counter + retry) is better for low-contention scenarios but requires retry logic.
Likely interview question: “Walk me through how you’d prevent overselling in a flash sale scenario where 10,000 users hit checkout simultaneously.”
2. Idempotent Payments
Engineering Problem: Payment Retry Safety A client retrying a failed payment request must not be charged twice. You implement idempotency: the client sends a unique Idempotency-Key header. The server checks Redis — if the key exists, return the cached response immediately without re-executing the Stripe charge. New keys execute normally and cache the result with a TTL.
Trade-off: Redis is a single point of failure for this cache. In production, you’d want Redis Sentinel or Cluster. For this project, the learning signal of the pattern is what matters.
Likely interview question: “How would you ensure your payment endpoint is safe to retry?”
3. Stripe Webhook Security
Engineering Problem: Unauthenticated Webhook Endpoints Any malicious actor can POST fake payment confirmations to your webhook endpoint. Stripe signs every webhook with a secret — you verify the Stripe-Signature header using the raw request body and your webhook secret before processing. You also use idempotency to handle duplicate webhook deliveries (Stripe guarantees at-least-once delivery).
Trade-off: You must use the raw request body for signature verification — Django’s request parsing would break this, so you use request.body directly before any parsing.
Likely interview question: “How would you secure a payment webhook endpoint and handle duplicate events?”
4. Celery Task Reliability
Engineering Problem: Async Task Design You never send email or process webhooks synchronously in the HTTP request cycle. Celery tasks are configured with exponential backoff retries (max_retries=3, countdown=60). For critical tasks (payment confirmation email), you use acks_late=True — the task is only acknowledged after successful completion, preventing loss on worker crash.
Trade-off: acks_late=True means a task can run twice on worker crash (at-least-once delivery). For email sends, this means a user might receive two confirmation emails. You add a sent-flag check inside the task to make it idempotent.
Likely interview question: “What happens to your background jobs if your worker crashes mid-execution?”
5. Cache Invalidation
Engineering Problem: Stale Cached Data Product listing pages are cached in Redis with a 5-minute TTL. When an admin updates a product, you must invalidate the cache immediately — stale prices are a business problem. You use Django signals: a post_save signal on Product triggers cache deletion for all affected listing keys.
Trade-off: This introduces coupling between the Product model and the caching layer via signals. An alternative is an explicit service layer that handles both the save and the cache invalidation in one call, making the coupling explicit and testable.
Likely interview question: “How do you handle cache invalidation when a product price changes?”
6. Modular Monolith vs. Microservices
Engineering Problem: Architecture Decision You chose a modular monolith: one codebase and one deployment, but with strict module boundaries (apps do not import each other’s models directly; they use service interfaces or signals). This gives you the organisational benefits of separation without the operational overhead of microservices.
When to decompose: If the Order processing team needs to deploy 10× per day independently of the Catalog team, that’s a decomposition trigger. For a team of one learning backend engineering, the monolith is unambiguously correct.
Likely interview question: “When would you consider breaking a monolith into microservices, and what would that decomposition look like for this system?”
Section 9: Priority Matrix
Rated 1–5 stars. Build = implement fully. Simplify = build the concept, skip the full production version. Later = Phase 7–8. Skip = over-engineering for a portfolio project.
Feature
Real-World Importance
Learning Value
Difficulty
Portfolio Value
Action
Product CRUD + Variants
★★★★★
★★★
Low
★★★
Build — Phase 1
PostgreSQL Full-Text Search
★★★★
★★★★
Medium
★★★★
Build — Phase 1
JWT Auth + RBAC
★★★★★
★★★★★
Medium
★★★★★
Build — Phase 2
Stock Reservation (transactions)
★★★★★
★★★★★
Medium
★★★★★
Build — Phase 3
Cart (anon + auth + merge)
★★★★★
★★★★
Medium
★★★★
Build — Phase 3
Order State Machine
★★★★★
★★★★★
Medium
★★★★★
Build — Phase 4
Stripe Payments + Webhooks
★★★★★
★★★★★
High
★★★★★
Build — Phase 4
Idempotency (payment)
★★★★★
★★★★★
Medium
★★★★★
Build — Phase 4
Celery Background Jobs
★★★★★
★★★★★
Medium
★★★★
Build — Phase 2+
Redis Caching + Invalidation
★★★★★
★★★★★
Medium
★★★★★
Build — Phase 5
Rate Limiting
★★★★
★★★★
Low
★★★★
Build — Phase 5
Audit Log (OrderEvent)
★★★★★
★★★★
Low
★★★★
Build — Phase 4
Coupons / Discounts
★★★★
★★★
Low
★★★
Simplify — Phase 3
Reviews (verified purchase)
★★★★
★★★
Low
★★★
Build — Phase 5
Docker + docker-compose
★★★★★
★★★★
Low
★★★★
Build — Phase 0
GitHub Actions CI/CD
★★★★★
★★★★
Low
★★★★★
Build — Phase 6
Structured Logging + Sentry
★★★★★
★★★★
Low
★★★★
Build — Phase 5
Semantic Search (pgvector)
★★★★
★★★★★
Medium
★★★★★
Build — Phase 7
AI Shopping Assistant
★★★
★★★★★
High
★★★★★
Build — Phase 7
Review Summarisation (LLM)
★★★
★★★★
Low
★★★★
Build — Phase 7
Product Description Generation
★★★
★★★
Low
★★★
Build — Phase 7
Event-Driven Architecture
★★★★
★★★★★
High
★★★★
Phase 8 — distributed systems roles
Elasticsearch / Typesense
★★★★
★★★★
High
★★★★
Phase 8 — after pgvector working
Microservices
★★★
★★
Very High
★★
SKIP — wrong tool for this scale
Kubernetes
★★★
★★
Very High
★★
SKIP — infra specialisation
Demand Forecasting ML
★★★
★★
Very High
★
SKIP — needs real data
GraphQL
★★★
★★★
Medium
★★★
SKIP — REST is sufficient
Complex Promotions Engine
★★★★
★★
High
★★
SKIP — high complexity, low signal
This roadmap is designed as a senior-engineer-designed learning project and career blueprint. Build one phase at a time, commit after each phase, and test before advancing. The goal is implementation depth over feature count — a well-explained trade-off in an interview is worth more than ten half-built features.