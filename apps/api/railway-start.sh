#!/bin/sh
set -e

echo "🚀 TrustEscrow API - Railway Startup"
echo "📅 $(date)"
echo "🔧 NODE_ENV: ${NODE_ENV:-development}"
echo "🌐 PORT: ${PORT:-3000}"
echo "💾 DATABASE_URL: ${DATABASE_URL:0:20}..."
echo ""

# Wait a moment for services to be ready
echo "⏳ Waiting for services to initialize..."
sleep 2

# Run database migrations with error handling
echo "🔄 Running database migrations..."
if npx prisma migrate deploy; then
  echo "✅ Database migrations completed successfully"
else
  echo "⚠️  Database migrations failed - continuing anyway (might be first deployment)"
  echo "🔄 Attempting to push database schema..."
  npx prisma db push --accept-data-loss --skip-generate || echo "⚠️  Schema push also failed"
fi

# Generate Prisma client (ensure it's available)
echo "🔧 Generating Prisma client..."
npx prisma generate

# Test database connection
echo "🔍 Testing database connection..."
if node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$queryRaw\`SELECT 1\`.then(() => {
  console.log('✅ Database connection successful');
  process.exit(0);
}).catch(err => {
  console.log('❌ Database connection failed:', err.message);
  process.exit(1);
}).finally(() => prisma.\$disconnect());
"; then
  echo "✅ Database connectivity verified"
else
  echo "⚠️  Database connection test failed - proceeding anyway"
fi

echo ""
echo "🎯 Starting TrustEscrow API server..."
echo "🌐 Health check will be available at: http://localhost:${PORT:-3000}/health"
echo ""

# Start the main application
exec node dist/index.js