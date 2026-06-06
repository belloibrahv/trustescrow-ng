# Simple Railway Dockerfile for TrustEscrow API
FROM node:20-alpine

WORKDIR /app

# Copy all necessary files for workspace build
COPY package*.json ./
COPY apps/api/ ./apps/api/
COPY packages/ ./packages/

# Install all dependencies (including workspaces)
RUN npm ci --ignore-scripts

# Generate Prisma client and build
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npm run build

# Install only production dependencies
RUN npm ci --only=production --ignore-scripts

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application (migrations + server)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]