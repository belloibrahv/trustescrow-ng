// apps/api/tests/integration/paystack-webhook.test.ts
import { describe, it, expect, vi } from 'vitest';
import Fastify from 'fastify';
import crypto from 'crypto';
import { webhookRoutes } from '../../src/routes/webhooks/paystack.routes';

vi.mock('../../src/redis/queues', () => ({
  paymentQueue: { add: vi.fn().mockResolvedValue({}) },
}));

vi.mock('../../src/db/prisma', () => ({
  prisma: {},
  writeAudit: vi.fn().mockResolvedValue({}),
}));

const WEBHOOK_SECRET = 'sk_test_mock_key';

function signPayload(payload: string): string {
  return crypto
    .createHmac('sha512', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
}

async function buildTestApp() {
  const app = Fastify();
  await app.register(webhookRoutes, { prefix: '/api/webhooks' });
  return app;
}

describe('POST /api/webhooks/paystack', () => {
  it('rejects webhook with invalid signature', async () => {
    const app = await buildTestApp();
    const payload = JSON.stringify({ event: 'charge.success', data: {} });

    const response = await app.inject({
      method: 'POST',
      url: '/api/webhooks/paystack',
      headers: { 'x-paystack-signature': 'invalid-signature' },
      payload,
    });

    expect(response.statusCode).toBe(401);
  });

  it('accepts webhook with valid HMAC signature', async () => {
    const app = await buildTestApp();
    const payload = JSON.stringify({
      event: 'charge.success',
      data: {
        reference: 'REF-001',
        amount: 8_000_000,
        customer: { email: '2348012345678@trustescrow.ng' },
        authorization: {},
      },
    });
    const signature = signPayload(payload);

    const response = await app.inject({
      method: 'POST',
      url: '/api/webhooks/paystack',
      headers: { 'x-paystack-signature': signature },
      payload,
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ received: true });
  });

  it('enqueues payment job for charge.success', async () => {
    const { paymentQueue } = await import('../../src/redis/queues');
    const app = await buildTestApp();
    const payload = JSON.stringify({
      event: 'charge.success',
      data: {
        reference: 'REF-002',
        amount: 5_000_000,
        customer: { email: 'test@trustescrow.ng' },
        authorization: { bank: 'wema' },
      },
    });

    await app.inject({
      method: 'POST',
      url: '/api/webhooks/paystack',
      headers: { 'x-paystack-signature': signPayload(payload) },
      payload,
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(paymentQueue.add).toHaveBeenCalledWith(
      'process-payment',
      expect.objectContaining({ reference: 'REF-002', amount: 5_000_000 })
    );
  });
});
