# Simplified Railway Dockerfile for debugging
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Copy types package if it exists
COPY packages/ ./packages/

# Install dependencies (including dev deps for build)
RUN npm ci --ignore-scripts

# Copy all source files
COPY apps/api/ ./apps/api/

# Work in API directory
WORKDIR /app/apps/api

# Generate Prisma client first
RUN npx prisma generate

# Build the application
RUN npm run build

# Verify build output
RUN ls -la dist/ && echo "✅ Build files created"

# Test that the built file loads
RUN node --check dist/index.js && echo "✅ Built JavaScript is valid"

# Install production dependencies
RUN npm ci --only=production --ignore-scripts

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app

# Make startup script executable
RUN chmod +x railway-start.sh

USER appuser

EXPOSE 3000

# Use the debug startup script
CMD ["./railway-start.sh"]