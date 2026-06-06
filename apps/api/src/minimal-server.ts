// Minimal server for Railway debugging
import Fastify from 'fastify';

const app = Fastify({
  logger: true,
  trustProxy: true,
});

// Simple health endpoint
app.get('/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    uptime: process.uptime(),
    version: '1.0.0'
  };
});

// Root endpoint
app.get('/', async () => {
  return {
    name: 'TrustEscrow API (Minimal)',
    status: 'running',
    timestamp: new Date().toISOString()
  };
});

// Start server
async function start() {
  try {
    const port = parseInt(process.env.PORT || '3000', 10);
    const host = '0.0.0.0';
    
    console.log('🚀 Starting minimal TrustEscrow API server...');
    console.log(`🌐 Listening on: ${host}:${port}`);
    
    await app.listen({ port, host });
    
    console.log('✅ Server started successfully!');
    console.log(`🏥 Health endpoint: http://${host}:${port}/health`);
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📡 SIGTERM received, shutting down gracefully');
  await app.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📡 SIGINT received, shutting down gracefully');
  await app.close();
  process.exit(0);
});

start().catch((err) => {
  console.error('💥 Startup error:', err);
  process.exit(1);
});