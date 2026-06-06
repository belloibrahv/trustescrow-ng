# Minimal Railway Dockerfile for debugging
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Install minimal dependencies
RUN cd apps/api && npm install fastify@^4.27.0 --save

# Copy minimal server source
COPY apps/api/src/minimal-server.ts ./apps/api/src/
COPY apps/api/railway-start.sh ./apps/api/

# Work in API directory
WORKDIR /app/apps/api

# Build minimal server
RUN npx tsc src/minimal-server.ts --outDir dist --target ES2022 --module commonjs --esModuleInterop --skipLibCheck

# Verify build
RUN ls -la dist/ && echo "✅ Minimal build created"
RUN node --check dist/minimal-server.js && echo "✅ Minimal JS is valid"

# Create startup script that uses minimal server
RUN echo '#!/bin/sh' > start-minimal.sh && \
    echo 'set -e' >> start-minimal.sh && \
    echo 'echo "🚀 Starting minimal TrustEscrow API..."' >> start-minimal.sh && \
    echo 'echo "📅 $(date)"' >> start-minimal.sh && \
    echo 'echo "🔧 NODE_ENV: ${NODE_ENV:-development}"' >> start-minimal.sh && \
    echo 'echo "🌐 PORT: ${PORT:-3000}"' >> start-minimal.sh && \
    echo 'echo "🆔 Container: $(hostname)"' >> start-minimal.sh && \
    echo 'echo ""' >> start-minimal.sh && \
    echo 'echo "▶️ Starting minimal server..."' >> start-minimal.sh && \
    echo 'exec node dist/minimal-server.js' >> start-minimal.sh && \
    chmod +x start-minimal.sh

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

# Use minimal startup
CMD ["./start-minimal.sh"]