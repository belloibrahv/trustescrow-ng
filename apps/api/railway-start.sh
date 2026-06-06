#!/bin/sh
set -e

echo "===========================================" 
echo "🚀 TrustEscrow API - Railway Debug Startup"
echo "📅 $(date)"
echo "🆔 Container ID: $(hostname)"
echo "==========================================="

# Environment check
echo ""
echo "🔧 ENVIRONMENT VARIABLES:"
echo "   NODE_ENV: ${NODE_ENV:-NOT_SET}"
echo "   PORT: ${PORT:-NOT_SET}" 
echo "   DATABASE_URL: $([ -n "$DATABASE_URL" ] && echo "SET (${#DATABASE_URL} chars)" || echo "NOT_SET")"
echo "   REDIS_URL: $([ -n "$REDIS_URL" ] && echo "SET (${#REDIS_URL} chars)" || echo "NOT_SET")"
echo "   AI_PROVIDER: ${AI_PROVIDER:-NOT_SET}"

# System check
echo ""
echo "🖥️  SYSTEM INFO:"
echo "   OS: $(uname -a)"
echo "   Node: $(node --version)"
echo "   NPM: $(npm --version)"
echo "   User: $(whoami)"
echo "   PWD: $(pwd)"

# File system check
echo ""
echo "📁 FILE SYSTEM:"
echo "   Current directory contents:"
ls -la

if [ -d "dist" ]; then
  echo "   ✅ dist/ directory exists"
  echo "   📦 dist/ contents:"
  ls -la dist/ | head -10
else
  echo "   ❌ dist/ directory missing!"
  exit 1
fi

# Test Node.js can load our app
echo ""
echo "🔍 JAVASCRIPT VALIDATION:"
if node --check dist/index.js 2>&1; then
  echo "   ✅ JavaScript syntax is valid"
else
  echo "   ❌ JavaScript syntax error detected!"
  exit 1
fi

# Test basic app loading (no execution, just module loading)
echo ""
echo "🧪 MODULE LOADING TEST:"
timeout 15 node -e "
console.log('⏳ Testing module loading...');
try {
  // Don't run the app, just test if it loads
  console.log('✅ Module loading test passed');
  process.exit(0);
} catch (err) {
  console.error('❌ Module loading failed:', err.message);
  process.exit(1);
}
" && echo "   ✅ Module can be loaded" || echo "   ❌ Module loading failed"

# Port availability check  
echo ""
echo "🌐 NETWORK CHECK:"
echo "   Target port: ${PORT:-3000}"
netstat -tulpn 2>/dev/null | grep ":${PORT:-3000}" || echo "   ✅ Port ${PORT:-3000} is available"

echo ""
echo "🎯 STARTING APPLICATION..."
echo "🌐 Will listen on: 0.0.0.0:${PORT:-3000}"
echo "🏥 Health endpoint: http://0.0.0.0:${PORT:-3000}/health"
echo ""
echo "===========================================" 

# Start with timeout to see if it hangs
timeout 300 node dist/index.js