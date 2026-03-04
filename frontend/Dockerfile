# =============================================================================
# UCHAGUZI SAFI — Frontend Production Dockerfile (Multi-stage)
# Build context: project ROOT (docker build -f frontend/Dockerfile .)
#
# Stage 1: Node — install deps and build Vite bundle
# Stage 2: Nginx — serve the static dist/ with SPA routing support
# =============================================================================

# ── Stage 1: Build ────────────────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies (cached layer)
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

# Copy source and build
COPY frontend/ ./
RUN npm run build


# ── Stage 2: Serve ────────────────────────────────────────────────────────
FROM nginx:stable-alpine

# Copy the Vite output
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config (React Router + API proxy + caching headers)
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
