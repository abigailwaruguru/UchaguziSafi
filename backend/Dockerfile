# =============================================================================
# UCHAGUZI SAFI — Backend Production Dockerfile
# Build context: project ROOT (docker build -f backend/Dockerfile .)
# =============================================================================
FROM python:3.13-slim

WORKDIR /app

# System dependencies (libpq5 = PostgreSQL client library for asyncpg)
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5 && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (layer cached unless requirements.txt changes)
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./

# Create uploads directory (mounted as volume in production)
RUN mkdir -p /app/uploads

EXPOSE 8000

# Run with 2 workers (override WEB_CONCURRENCY env var for more)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers ${WEB_CONCURRENCY:-2}"]
