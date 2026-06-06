// apps/api/src/routes/webhooks/paystack.routes.ts
import type { FastifyPluginAsync } from 'fastify';
import { validatePaystackWebhook } from '../../services/payment/paystack.service';
import { paymentQueue } from '../../redis/queues';
import { logger } from '../../utils/logger';
import { writeAudit } from '../../db/prisma';

export const webhookRoutes: FastifyPluginAsync = async (app) => {
  // Paystack charge.success — fires when money arrives in DVA
  app.post<{ Body: string }>(
    '/paystack',
    {
      config: { rawBody: true },
    },
    async (request, reply) => {
      const signature = (request.headers['x-paystack-signature'] as string) ?? '';
      const rawBody = request.body as unknown as string;

      // ── HMAC validation — reject ALL unsigned events ──────────────────────
      if (!validatePaystackWebhook(rawBody, signature)) {
        logger.warn({ ip: request.ip }, 'Rejected Paystack webhook — invalid signature');
        return reply.code(401).send({ error: 'Invalid signature' });
      }

      // ── Respond 200 immediately — Paystack will retry if we don't ────────
      reply.code(200).send({ received: true });

      try {
        const event = JSON.parse(rawBody);

        await writeAudit({
          action: `PAYSTACK_WEBHOOK_${event.event}`,
          payload: { event: event.event, reference: event.data?.reference },
          actorType: 'paystack_webhook',
        });

        // Only process charge.success for now
        if (event.event === 'charge.success') {
          await paymentQueue.add('process-payment', {
            reference: event.data.reference,
            amount: event.data.amount,
            customerEmail: event.data.customer?.email,
            authorization: event.data.authorization,
          });
        }

        // transfer.success — log for audit, no further action needed
        if (event.event === 'transfer.success') {
          logger.info({ reference: event.data?.reference }, 'Paystack transfer confirmed');
        }

        // transfer.failed — alert operations team
        if (event.event === 'transfer.failed') {
          logger.error({ reference: event.data?.reference }, 'Paystack transfer FAILED — manual intervention required');
        }
      } catch (err) {
        logger.error(err, 'Paystack webhook processing error');
      }
    }
  );
};
