# Railway Dockerfile for TrustEscrow API
FROM node:20-alpine

WORKDIR /app

# Copy all package files first for better caching
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/types/package*.json ./packages/types/

# Install dependencies
RUN npm ci --ignore-scripts

# Copy source code
COPY apps/api/src ./apps/api/src
COPY apps/api/prisma ./apps/api/prisma
COPY apps/api/build.js ./apps/api/
COPY apps/api/tsconfig.json ./apps/api/
COPY apps/api/railway-start.sh ./apps/api/
COPY packages/types ./packages/types

# Change to API directory and build
WORKDIR /app/apps/api

# Make startup script executable
RUN chmod +x railway-start.sh

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Install only production dependencies
RUN npm ci --only=production --ignore-scripts

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

# Use the Railway startup script
CMD ["./railway-start.sh"]