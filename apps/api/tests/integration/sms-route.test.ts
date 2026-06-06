// apps/api/tests/integration/sms-route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import { smsRoutes } from '../../src/routes/sms/sms.routes';

// Mock BullMQ queue
vi.mock('../../src/redis/queues', () => ({
  smsQueue: {
    add: vi.fn().mockResolvedValue({ id: 'mock-job-id' }),
  },
}));

// Mock Prisma
vi.mock('../../src/db/prisma', () => ({
  prisma: {
    message: {
      findUnique: vi.fn().mockResolvedValue(null), // No duplicate
      create: vi.fn().mockResolvedValue({}),
    },
  },
}));

// Mock Redis client for rate limiting
vi.mock('../../src/redis/client', () => ({
  redisClient: {
    status: 'ready',
    get: vi.fn(),
    set: vi.fn(),
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn(),
  },
}));

async function buildTestApp() {
  const app = Fastify();
  await app.register(smsRoutes, { prefix: '/api/sms' });
  return app;
}

describe('POST /api/sms/inbound', () => {
  it('returns 200 immediately for valid AT webhook', async () => {
    const app = await buildTestApp();

    const response = await app.inject({
      method: 'POST',
      url: '/api/sms/inbound',
      payload: {
        from: '+2348012345678',
        to: '15629',
        text: 'START',
        id: 'MSG-001',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ status: 'received' });
  });

  it('enqueues job when message is new', async () => {
    const { smsQueue } = await import('../../src/redis/queues');
    const app = await buildTestApp();

    await app.inject({
      method: 'POST',
      url: '/api/sms/inbound',
      payload: {
        from: '+2348012345678',
        to: '15629',
        text: 'START',
        id: 'MSG-002',
      },
    });

    // Give async code a tick to run
    await new Promise((r) => setTimeout(r, 50));
    expect(smsQueue.add).toHaveBeenCalledWith(
      'process-sms',
      expect.objectContaining({ phone: '+2348012345678', text: 'START' }),
      expect.any(Object)
    );
  });

  it('skips duplicate AT message IDs', async () => {
    const { prisma } = await import('../../src/db/prisma');
    // Simulate already-processed message
    (prisma.message.findUnique as any).mockResolvedValueOnce({ id: 'existing' });
    const { smsQueue } = await import('../../src/redis/queues');
    const addSpy = vi.spyOn(smsQueue, 'add');

    const app = await buildTestApp();
    await app.inject({
      method: 'POST',
      url: '/api/sms/inbound',
      payload: { from: '+2348012345678', to: '15629', text: 'DUPE', id: 'MSG-DUPE' },
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(addSpy).not.toHaveBeenCalled();
  });
});
