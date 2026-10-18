# =============================================================================
# UN1Q Backend — Production Dockerfile
# Python 3.13-slim (stable) | Django + Gunicorn
# =============================================================================

# ── Stage 1: Build — install all dependencies ─────────────────────────────────
FROM python:3.13-slim AS builder

WORKDIR /app

# System libs required to compile psycopg2 and Pillow
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements first (better Docker layer caching)
COPY requirements/ requirements/

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r requirements/production.txt


# ── Stage 2: Runtime — lean image without build tools ─────────────────────────
FROM python:3.13-slim AS runtime

# Env vars
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=config.settings.production

WORKDIR /app

# Only runtime system libs (no gcc, no build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    libjpeg62-turbo \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder stage
COPY --from=builder /usr/local/lib/python3.13/site-packages /usr/local/lib/python3.13/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy project source code
COPY . .

# Create a non-root user for security (never run as root in production)
RUN addgroup --system django \
 && adduser --system --ingroup django django \
 && chown -R django:django /app

USER django

# Collect static files at build time
# A dummy SECRET_KEY is used only for this step — real key is injected at runtime
RUN SECRET_KEY=build-time-dummy \
    DATABASE_URL=postgres://dummy:dummy@localhost:5432/dummy \
    REDIS_URL=redis://localhost:6379/1 \
    CELERY_BROKER_URL=redis://localhost:6379/0 \
    python manage.py collectstatic --noinput

EXPOSE 8000

# Gunicorn: 3 workers, 2 threads each (suitable for t3.small)
# Increase workers to (2 x CPU cores + 1) when scaling up
CMD ["gunicorn", "config.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "3", \
     "--threads", "2", \
     "--worker-class", "sync", \
     "--timeout", "120", \
     "--keep-alive", "5", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "--log-level", "info"]
