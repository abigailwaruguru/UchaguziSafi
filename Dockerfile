# =============================================================================
# UCHAGUZI SAFI — Production Dockerfile
# Multi-stage build: React frontend → FastAPI backend with static serving
# Legal Basis: Election Campaign Financing Act, Cap. 7A (2013)
# =============================================================================

# ── Stage 1: Build React Frontend ────────────────────────────────────
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

# Install dependencies first (cache layer)
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --production=false

# Copy source and build
COPY frontend/ ./
RUN npm run build
# Output: /app/frontend/dist/


# ── Stage 2: Python Backend + Static Files ───────────────────────────
FROM python:3.13-slim AS production

# Security: non-root user
RUN groupadd -r uchaguzi && useradd -r -g uchaguzi -d /app -s /sbin/nologin uchaguzi

WORKDIR /app

# System deps for psycopg2-binary
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5 && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./

# Copy built frontend into /app/static
COPY --from=frontend-build /app/frontend/dist ./static/

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R uchaguzi:uchaguzi /app

# Switch to non-root user
USER uchaguzi

# Expose port (Railway injects PORT env var)
EXPOSE ${PORT:-8000}

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT:-8000}/health')" || exit 1

# Start: run migrations, then launch uvicorn
CMD alembic upgrade head && \
    uvicorn app.main:app \
        --host 0.0.0.0 \
        --port ${PORT:-8000} \
        --workers ${WEB_CONCURRENCY:-2} \
        --log-level ${LOG_LEVEL:-info}
