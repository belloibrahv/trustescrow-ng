// apps/api/src/index.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env';
import { initSentry, captureException } from './config/sentry';
import { redisClient } from './redis/client';
import { prisma } from './db/prisma';
import { smsRoutes } from './routes/sms/sms.routes';
import { webhookRoutes } from './routes/webhooks/paystack.routes';
import { adminRoutes } from './routes/admin/admin.routes';
import { authRoutes } from './routes/admin/auth.routes';
import { initWorkers } from './workers';
import { initializeAdminUsers } from './services/auth/admin-auth.service';
import { logger } from './utils/logger';
import { redisAvailable } from './redis/client';

// ─── Sentry Init ──────────────────────────────────────────────────────────────
initSentry();

// ─── Fastify App ──────────────────────────────────────────────────────────────
const app = Fastify({
  logger: env.NODE_ENV === 'development',
  trustProxy: true,   // Required for correct IP behind Railway/Render proxy
  bodyLimit: 1_048_576, // 1MB
});

async function bootstrap() {
  // ── Initialize Admin Users ─────────────────────────────────────────────────
  initializeAdminUsers();

  const allowedOrigins = Array.from(
    new Set(
      [
        env.APP_URL,
        env.ADMIN_CORS_ORIGIN,
        env.NODE_ENV === 'production'
          ? 'https://trustescrow-ng-admin.vercel.app'
          : 'http://localhost:3001',
      ].filter((origin): origin is string => Boolean(origin))
    )
  );

  // ── Plugins ────────────────────────────────────────────────────────────────
  await app.register(cors, {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  await app.register(rateLimit, {
    global: true,
    max: 30,
    timeWindow: '1 minute',
    ...(redisAvailable ? { redis: redisClient } : {}),
    keyGenerator: (request) => request.ip,
    allowList: (request) => ['/health', '/health/full', '/'].includes(request.url),
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Too many requests. Please wait before trying again.',
    }),
  });

  // ── Routes ─────────────────────────────────────────────────────────────────
  await app.register(smsRoutes, { prefix: '/api/sms' });
  await app.register(webhookRoutes, { prefix: '/api/webhooks' });
  await app.register(authRoutes, { prefix: '/api/admin/auth' });
  await app.register(adminRoutes, { prefix: '/api/admin' });

  // ── Basic Routes ──────────────────────────────────────────────────────────
  // Simple root endpoint
  app.get('/', async () => {
    return {
      name: 'TrustEscrow API',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString()
    };
  });

  // ── Health Check ───────────────────────────────────────────────────────────
  // Simple health check that responds immediately
  app.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: env.NODE_ENV,
      port: env.PORT,
      uptime: process.uptime(),
      message: 'API is running'
    };
  });

  // Advanced health check with DB/Redis testing
  app.get('/health/full', async () => {
    try {
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;
      const dbStatus = 'connected';
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: env.NODE_ENV,
        port: env.PORT,
        uptime: process.uptime(),
        db: dbStatus,
        redis: redisClient.status === 'ready' ? 'connected' : 'disconnected',
      };
    } catch (error) {
      return {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        env: env.NODE_ENV,
        port: env.PORT,
        uptime: process.uptime(),
        db: 'disconnected',
        redis: redisClient.status === 'ready' ? 'connected' : 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  // ── Global Error Handler ───────────────────────────────────────────────────
  app.setErrorHandler((error, request, reply) => {
    logger.error({ error, url: request.url }, 'Unhandled request error');
    captureException(error, { url: request.url, method: request.method });
    reply.code(500).send({ error: 'Internal server error' });
  });

  // ── Start Workers ──────────────────────────────────────────────────────────
  // ── Listen ─────────────────────────────────────────────────────────────────
  // Railway's Fastify deployment expects the app to listen on `::`
  // so it is reachable over both the public and private network.
  await app.listen({ port: env.PORT, host: '::' });

  logger.info(`🚀 TrustEscrow NG API running on port ${env.PORT} [${env.NODE_ENV}]`);

  // Start workers after the HTTP server is confirmed healthy.
  void initWorkers();
}

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutting down gracefully...');
  await app.close();
  await prisma.$disconnect();
  await redisClient.quit();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

bootstrap().catch((err) => {
  logger.error(err, 'Failed to start server');
  process.exit(1);
});
