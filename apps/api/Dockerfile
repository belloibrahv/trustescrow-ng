# apps/api/Dockerfile
# Multi-stage production build
# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps first (layer caching)
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/ ./packages/
RUN npm ci --workspace=apps/api --ignore-scripts

# Copy source and build
COPY apps/api/ ./apps/api/
RUN cd apps/api && npx prisma generate
RUN npm run build --workspace=apps/api

# ─────────────────────────────────────────────────────────────
# Stage 2: Runner — minimal production image
FROM node:20-alpine AS runner

WORKDIR /app

# Security: run as non-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only what's needed
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/package.json ./package.json

# Apply migrations and start — Railway auto-runs this CMD
USER appuser
EXPOSE 3000

# Run migrations before starting server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
