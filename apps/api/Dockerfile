# Absolute minimal test for Railway
FROM alpine:3.18

# Install Node.js
RUN apk add --no-cache nodejs npm curl

WORKDIR /app

# Create the most basic possible server inline
RUN cat > server.js << 'EOF'
console.log('🚀 STARTING RAILWAY TEST SERVER');
console.log('📅 Time:', new Date().toISOString());
console.log('🔧 Node version:', process.version);
console.log('🌐 Environment:', JSON.stringify({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  PWD: process.cwd()
}, null, 2));

const http = require('http');
const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  console.log(`📨 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  
  const response = {
    status: 'ok',
    message: 'Railway test server running',
    timestamp: new Date().toISOString(),
    port: port,
    url: req.url,
    uptime: process.uptime()
  };
  
  res.end(JSON.stringify(response, null, 2));
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});

server.listen(port, '0.0.0.0', () => {
  console.log('✅ Server listening on http://0.0.0.0:' + port);
  console.log('🏥 Health: http://0.0.0.0:' + port + '/health');
  console.log('🎯 Ready for Railway health checks!');
});

// Self-test after 2 seconds
setTimeout(() => {
  const selfTest = http.get(`http://localhost:${port}/health`, (res) => {
    console.log('🧪 Self-test successful, status:', res.statusCode);
  });
  selfTest.on('error', (err) => {
    console.log('⚠️ Self-test failed:', err.message);
  });
}, 2000);
EOF

# Create startup script with diagnostics
RUN cat > start.sh << 'EOF'
#!/bin/sh
echo "========================================"
echo "🚀 Railway Test Container Starting"
echo "📅 $(date)"
echo "🆔 Hostname: $(hostname)"
echo "🌐 Network interfaces:"
ip addr show || ifconfig || echo "No network info available"
echo "🔧 Environment variables:"
env | grep -E "(NODE_ENV|PORT)" || echo "No relevant env vars"
echo "📂 Working directory: $(pwd)"
echo "📁 Files in /app:"
ls -la /app
echo "🖥️ System info:"
uname -a
echo "💾 Memory:"
free -h || echo "Memory info not available"
echo "🌐 Port ${PORT:-3000} check:"
netstat -tulpn 2>/dev/null | grep ":${PORT:-3000}" || echo "Port available"
echo "========================================"
echo "▶️ Starting Node.js server..."
exec node server.js
EOF

RUN chmod +x start.sh

EXPOSE 3000

CMD ["./start.sh"]