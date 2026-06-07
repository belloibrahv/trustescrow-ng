// apps/api/src/railway-server.ts
// Ultra-minimal Railway server for debugging deployment issues
const http = require('http');

// Environment setup
const PORT = process.env.PORT || 3000;
const HOST = '::';

console.log('🚀 RAILWAY MINIMAL SERVER STARTING');
console.log('📅 Started at:', new Date().toISOString());
console.log('🌐 Binding to:', `${HOST}:${PORT}`);
console.log('📍 Node version:', process.version);
console.log('📍 Platform:', process.platform);

// Create basic HTTP server
const server = http.createServer((req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`📨 ${timestamp} ${req.method} ${req.url}`);
  
  // Set CORS headers
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  
  const response = {
    status: 'ok',
    message: 'Railway deployment successful',
    timestamp: timestamp,
    port: PORT,
    host: HOST,
    url: req.url,
    method: req.method,
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development',
    deployment: 'railway-minimal'
  };
  
  res.end(JSON.stringify(response, null, 2));
});

// Handle server errors
server.on('error', (err) => {
  console.error('❌ SERVER ERROR:', err.message);
  console.error('❌ Error code:', err.code);
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
  } else if (err.code === 'EACCES') {
    console.error(`❌ Permission denied to bind to port ${PORT}!`);
  }
  process.exit(1);
});

// Start server
server.listen(PORT, HOST, () => {
  console.log(`✅ Server successfully listening on ${HOST}:${PORT}`);
  console.log(`🏥 Health endpoint ready: http://${HOST}:${PORT}/health`);
  console.log(`🌐 Root endpoint ready: http://${HOST}:${PORT}/`);
  console.log('🎯 Ready for Railway health checks!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📡 SIGTERM received, shutting down...');
  server.close(() => {
    console.log('✅ Server closed gracefully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📡 SIGINT received, shutting down...');
  server.close(() => {
    console.log('✅ Server closed gracefully');
    process.exit(0);
  });
});

// Log process information
console.log('🔧 Process info:');
console.log('   PID:', process.pid);
console.log('   User:', process.getuid ? process.getuid() : 'unknown');
console.log('   Memory:', Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB');

// Self-test after 2 seconds
setTimeout(() => {
  console.log('🧪 Running self-test...');
  const testReq = http.get(`http://localhost:${PORT}/health`, (res) => {
    console.log(`✅ Self-test passed: HTTP ${res.statusCode}`);
    res.on('data', (data) => {
      console.log('📊 Response preview:', data.toString().substring(0, 100) + '...');
    });
  });
  testReq.on('error', (err) => {
    console.error('❌ Self-test failed:', err.message);
  });
}, 2000);
