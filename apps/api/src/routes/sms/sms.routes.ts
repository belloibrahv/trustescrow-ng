// apps/api/src/routes/sms/sms.routes.ts
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { smsQueue } from '../../redis/queues';
import { prisma } from '../../db/prisma';
import { logger } from '../../utils/logger';

// Africa's Talking sends form-encoded POST body
const atWebhookSchema = z.object({
  from: z.string(),
  to: z.string(),
  text: z.string(),
  id: z.string(),
  date: z.string().optional(),
  networkCode: z.string().optional(),
});

export const smsRoutes: FastifyPluginAsync = async (app) => {
  app.post('/inbound', async (request, reply) => {
    // ── CRITICAL: Respond HTTP 200 IMMEDIATELY ────────────────────────────
    // Africa's Talking requires response within 5 seconds.
    // If we exceed this, AT will retry and create duplicate processing.
    reply.code(200).send({ status: 'received' });

    try {
      const body = atWebhookSchema.parse(request.body);
      logger.info({ from: body.from, messageId: body.id }, 'Inbound SMS received');

      // ── Idempotency: skip if already processed ──────────────────────────
      const existing = await prisma.message.findUnique({
        where: { atMessageId: body.id },
      });
      if (existing) {
        logger.info({ messageId: body.id }, 'Duplicate SMS — skipping');
        return;
      }

      // ── Enqueue for async processing ────────────────────────────────────
      await smsQueue.add(
        'process-sms',
        {
          phone: body.from,
          text: body.text.trim(),
          messageId: body.id,
          shortcode: body.to,
        },
        {
          jobId: `sms-${body.id}`, // Dedup at queue level too
        }
      );
    } catch (err) {
      // Don't throw — we already sent 200
      logger.error(err, 'Failed to enqueue inbound SMS');
    }
  });

  // Health endpoint for monitoring AT webhook delivery
  app.get('/health', async () => ({ status: 'ok', queue: 'sms-queue' }));
};
