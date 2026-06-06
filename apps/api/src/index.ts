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

  // ── Plugins ────────────────────────────────────────────────────────────────
  await app.register(cors, {
    origin: [env.APP_URL, 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  await app.register(rateLimit, {
    global: true,
    max: 30,
    timeWindow: '1 minute',
    redis: redisClient,
    keyGenerator: (request) => request.ip,
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

  // ── Health Check ───────────────────────────────────────────────────────────
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
    db: 'connected',
    redis: redisClient.status === 'ready' ? 'connected' : 'disconnected',
  }));

  // ── Global Error Handler ───────────────────────────────────────────────────
  app.setErrorHandler((error, request, reply) => {
    logger.error({ error, url: request.url }, 'Unhandled request error');
    captureException(error, { url: request.url, method: request.method });
    reply.code(500).send({ error: 'Internal server error' });
  });

  // ── Start Workers ──────────────────────────────────────────────────────────
  initWorkers();

  // ── Listen ─────────────────────────────────────────────────────────────────
  await app.listen({ port: env.PORT, host: '0.0.0.0' });

  logger.info(`🚀 TrustEscrow NG API running on port ${env.PORT} [${env.NODE_ENV}]`);
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
