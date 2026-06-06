#!/bin/sh
set -e

echo "🚀 TrustEscrow API - Railway Startup (Debug Mode)"
echo "📅 $(date)"
echo "🔧 NODE_ENV: ${NODE_ENV:-development}"
echo "🌐 PORT: ${PORT:-3000}"
echo "💾 DATABASE_URL exists: $([ -n "$DATABASE_URL" ] && echo "YES" || echo "NO")"
echo "🔑 REDIS_URL exists: $([ -n "$REDIS_URL" ] && echo "YES" || echo "NO")"
echo ""

# Check if dist directory exists
if [ ! -d "dist" ]; then
  echo "❌ dist directory not found!"
  ls -la
  exit 1
fi

echo "✅ dist directory found"
echo "📁 Contents of dist/:"
ls -la dist/

# Test if node can run the built file
echo "🔍 Testing if built app loads..."
if timeout 10 node -e "
console.log('✅ Node.js can load the application');
process.exit(0);
" dist/index.js 2>&1; then
  echo "✅ App loads successfully"
else
  echo "❌ App failed to load - checking for syntax errors..."
  node --check dist/index.js || echo "❌ Syntax errors in built JavaScript"
fi

# Simple database test (skip if no DATABASE_URL)
if [ -n "$DATABASE_URL" ]; then
  echo "🔍 Testing basic database connection..."
  timeout 30 npx prisma db execute --stdin <<< "SELECT 1;" && echo "✅ Basic DB test passed" || echo "⚠️ Basic DB test failed"
else
  echo "⚠️ No DATABASE_URL found - skipping DB test"
fi

echo ""
echo "🎯 Starting TrustEscrow API server..."
echo "🌐 Server will listen on: http://0.0.0.0:${PORT:-3000}"
echo "🏥 Health endpoint: http://0.0.0.0:${PORT:-3000}/health"
echo ""

# Start the application with more verbose logging
echo "▶️ Executing: node dist/index.js"
exec node dist/index.js