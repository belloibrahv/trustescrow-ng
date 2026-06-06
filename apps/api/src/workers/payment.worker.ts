// apps/api/src/workers/payment.worker.ts
import { Worker, type Job } from 'bullmq';
import { DealStatus } from '@prisma/client';
import { redisClient } from '../redis/client';
import { prisma, writeAudit } from '../db/prisma';
import { sendSmsToBoth, SMS } from '../services/sms/sms.service';
import { formatNgn } from '../utils/sanitize';
import { logger } from '../utils/logger';

interface PaymentJobData {
  reference: string;
  amount: number;        // In kobo (Paystack sends kobo)
  customerEmail: string;
  authorization: Record<string, unknown>;
}

export const paymentWorker = new Worker<PaymentJobData>(
  'payment-queue',
  async (job: Job<PaymentJobData>) => {
    const { reference, amount } = job.data;

    logger.info({ reference, amount }, 'Processing Paystack charge.success');

    // ── Find deal by DVA reference ──────────────────────────────────────────
    // The charge reference from Paystack maps back to the deal
    const deal = await prisma.deal.findFirst({
      where: {
        paystackChargeRef: reference,
        status: DealStatus.PAYMENT_PENDING,
      },
      include: { buyer: true, seller: true },
    });

    if (!deal) {
      // Try matching by DVA account (fallback — Paystack may use different ref format)
      logger.warn({ reference }, 'Deal not found by charge ref — may already be processed');
      return;
    }

    // ── Amount reconciliation (0.1% tolerance) ──────────────────────────────
    const expectedKobo = Number(deal.amountKobo);
    const tolerance = expectedKobo * 0.001;
    const received = amount;

    if (received < expectedKobo - tolerance) {
      // Underpayment — prompt for top-up
      await writeAudit({
        dealId: deal.id,
        action: 'UNDERPAYMENT_DETECTED',
        payload: { expected: expectedKobo, received },
        actorType: 'paystack_webhook',
      });
      const shortfall = formatNgn(BigInt(expectedKobo - received));
      await prisma.deal.update({
        where: { id: deal.id },
        data: { paystackChargeRef: reference },
      });
      if (deal.buyer) {
        const { sendSms } = await import('../services/sms/sms.service');
        await sendSms({
          to: deal.buyer.phone,
          message: `Payment received but ${shortfall} short for deal ${deal.dealRef}. Please top up.`,
          dealRef: deal.dealRef,
        });
      }
      return;
    }

    // ── Advance deal to FUNDS_HELD ──────────────────────────────────────────
    await prisma.deal.update({
      where: { id: deal.id },
      data: {
        status: DealStatus.FUNDS_HELD,
        paystackChargeRef: reference,
      },
    });

    await writeAudit({
      dealId: deal.id,
      action: 'FUNDS_HELD',
      payload: { reference, amountKobo: received },
      actorType: 'paystack_webhook',
    });

    // Notify both parties
    if (deal.buyer && deal.seller) {
      await sendSmsToBoth({
        buyerPhone: deal.buyer.phone,
        sellerPhone: deal.seller.phone,
        message: SMS.fundsReceived(deal.dealRef),
        dealRef: deal.dealRef,
      });
    }

    logger.info({ dealId: deal.id, dealRef: deal.dealRef }, 'Deal advanced to FUNDS_HELD');
  },
  {
    connection: redisClient,
    concurrency: 5,
  }
);

paymentWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err: err.message }, 'Payment job failed');
});
