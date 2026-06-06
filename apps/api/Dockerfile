# Ultra-minimal Railway Dockerfile for debugging
FROM node:20-alpine

WORKDIR /app

# Install curl for debugging
RUN apk add --no-cache curl netstat-nat

# Create the simplest possible server
RUN echo 'const http = require("http");' > simple-server.js && \
    echo 'const port = process.env.PORT || 3000;' >> simple-server.js && \
    echo 'const server = http.createServer((req, res) => {' >> simple-server.js && \
    echo '  console.log(`📨 Request: ${req.method} ${req.url}`);' >> simple-server.js && \
    echo '  if (req.url === "/health") {' >> simple-server.js && \
    echo '    res.writeHead(200, {"Content-Type": "application/json"});' >> simple-server.js && \
    echo '    res.end(JSON.stringify({status:"ok",port:port,time:new Date().toISOString()}));' >> simple-server.js && \
    echo '  } else {' >> simple-server.js && \
    echo '    res.writeHead(200, {"Content-Type": "application/json"});' >> simple-server.js && \
    echo '    res.end(JSON.stringify({name:"TrustEscrow Debug",status:"running"}));' >> simple-server.js && \
    echo '  }' >> simple-server.js && \
    echo '});' >> simple-server.js && \
    echo 'server.listen(port, "0.0.0.0", () => {' >> simple-server.js && \
    echo '  console.log(`🚀 Debug server running on http://0.0.0.0:${port}`);' >> simple-server.js && \
    echo '  console.log(`🏥 Health: http://0.0.0.0:${port}/health`);' >> simple-server.js && \
    echo '});' >> simple-server.js && \
    echo 'console.log("📅 Server starting at:", new Date().toISOString());' >> simple-server.js && \
    echo 'console.log("🔧 NODE_ENV:", process.env.NODE_ENV);' >> simple-server.js && \
    echo 'console.log("🌐 PORT:", port);' >> simple-server.js

# Create comprehensive startup script
RUN echo '#!/bin/sh' > start-debug.sh && \
    echo 'set -e' >> start-debug.sh && \
    echo 'echo "===========================================" ' >> start-debug.sh && \
    echo 'echo "🚀 ULTRA DEBUG MODE - Railway Container"' >> start-debug.sh && \
    echo 'echo "📅 $(date)"' >> start-debug.sh && \
    echo 'echo "🆔 Container: $(hostname)"' >> start-debug.sh && \
    echo 'echo "==========================================="' >> start-debug.sh && \
    echo 'echo "🔧 Environment Variables:"' >> start-debug.sh && \
    echo 'echo "   NODE_ENV: ${NODE_ENV:-NOT_SET}"' >> start-debug.sh && \
    echo 'echo "   PORT: ${PORT:-NOT_SET}"' >> start-debug.sh && \
    echo 'echo "   PWD: $(pwd)"' >> start-debug.sh && \
    echo 'echo "   USER: $(whoami)"' >> start-debug.sh && \
    echo 'echo ""' >> start-debug.sh && \
    echo 'echo "🖥️  System Info:"' >> start-debug.sh && \
    echo 'echo "   OS: $(uname -a)"' >> start-debug.sh && \
    echo 'echo "   Node: $(node --version)"' >> start-debug.sh && \
    echo 'echo "   Memory: $(free -h | grep Mem || echo Available)"' >> start-debug.sh && \
    echo 'echo ""' >> start-debug.sh && \
    echo 'echo "📁 Files:"' >> start-debug.sh && \
    echo 'ls -la' >> start-debug.sh && \
    echo 'echo ""' >> start-debug.sh && \
    echo 'echo "🌐 Network Check:"' >> start-debug.sh && \
    echo 'echo "   Checking port ${PORT:-3000} availability..."' >> start-debug.sh && \
    echo 'netstat -tulpn 2>/dev/null | grep ":${PORT:-3000}" || echo "   ✅ Port ${PORT:-3000} available"' >> start-debug.sh && \
    echo 'echo ""' >> start-debug.sh && \
    echo 'echo "▶️  Starting simple HTTP server..."' >> start-debug.sh && \
    echo 'node simple-server.js &' >> start-debug.sh && \
    echo 'SERVER_PID=$!' >> start-debug.sh && \
    echo 'echo "🔧 Server PID: $SERVER_PID"' >> start-debug.sh && \
    echo 'sleep 3' >> start-debug.sh && \
    echo 'echo ""' >> start-debug.sh && \
    echo 'echo "🧪 Testing server locally..."' >> start-debug.sh && \
    echo 'curl -s http://localhost:${PORT:-3000}/health || echo "❌ Local health check failed"' >> start-debug.sh && \
    echo 'echo ""' >> start-debug.sh && \
    echo 'echo "🎯 Server should be ready for Railway health checks"' >> start-debug.sh && \
    echo 'echo "⏳ Keeping container alive..."' >> start-debug.sh && \
    echo 'wait $SERVER_PID' >> start-debug.sh && \
    chmod +x start-debug.sh

EXPOSE 3000

# Use the ultra-simple startup
CMD ["./start-debug.sh"]