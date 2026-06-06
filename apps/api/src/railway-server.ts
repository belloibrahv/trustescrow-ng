// apps/api/src/railway-server.ts
// Minimal Railway-compatible server for deployment troubleshooting
import Fastify from 'fastify';
import { env } from './config/env';

console.log('🚀 Railway Server Starting...');
console.log('📅', new Date().toISOString());
console.log('🌐 Port:', env.PORT);
console.log('📍 Environment:', env.NODE_ENV);

const app = Fastify({
  logger: false, // Disable fastify logging for cleaner Railway logs
  trustProxy: true,
  bodyLimit: 1_048_576,
});

async function startServer() {
  try {
    // Basic health check route (no database dependencies)
    app.get('/health', async () => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: env.NODE_ENV,
        port: env.PORT,
        uptime: process.uptime(),
        message: 'Railway deployment successful',
      };
    });

    // Root route
    app.get('/', async () => {
      return {
        name: 'TrustEscrow API',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        deployment: 'railway',
      };
    });

    // Add basic error handler
    app.setErrorHandler((error, request, reply) => {
      console.error('Request error:', error.message);
      reply.code(500).send({ error: 'Internal server error' });
    });

    // Start server
    await app.listen({ 
      port: env.PORT, 
      host: '0.0.0.0' // CRITICAL for Railway
    });

    console.log(`✅ Server listening on 0.0.0.0:${env.PORT}`);
    console.log(`🏥 Health check: http://0.0.0.0:${env.PORT}/health`);
    console.log('🎯 Ready for Railway health checks!');

  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📡 SIGTERM received, shutting down...');
  await app.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📡 SIGINT received, shutting down...');
  await app.close();
  process.exit(0);
});

// Start the server
startServer().catch((err) => {
  console.error('❌ Failed to start Railway server:', err);
  process.exit(1);
});