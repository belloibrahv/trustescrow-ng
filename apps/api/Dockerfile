# Production Railway Dockerfile for TrustEscrow API
FROM node:20-alpine

# Install required system dependencies
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files
COPY apps/api/package*.json ./
COPY apps/api/tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY apps/api/src ./src
COPY apps/api/prisma ./prisma

# Build the application
RUN npm run build

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S trustescrow -u 1001
USER trustescrow

# Expose port (Railway will provide PORT env var)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/health || exit 1

# Start the application
CMD ["npm", "start"]