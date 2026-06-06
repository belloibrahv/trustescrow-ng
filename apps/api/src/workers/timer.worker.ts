// apps/api/src/workers/timer.worker.ts
import { Worker, Job } from 'bullmq';
import { redisClient } from '../redis/client';
import { prisma, writeAudit } from '../db/prisma';
import { sendSms } from '../services/sms/sms.service';
import { initiateRefund } from '../services/payment/paystack.service';
import { logger } from '../utils/logger';
import { DealStatus, DisputeStatus } from '@prisma/client';
import { env } from '../config/env';

interface TimerJobData {
  type: 'dva-expiry' | 'dispute-escalation';
  dealId?: string;
  disputeId?: string;
}

/**
 * Timer Worker - Handles time-based operations:
 * 1. DVA expiry (7 days) - Auto-refund if no payment
 * 2. Dispute auto-escalation (48 hours) - Escalate to human if unresolved
 */
export const timerWorker = new Worker<TimerJobData>(
  'timer-queue',
  async (job: Job<TimerJobData>) => {
    const { type, dealId, disputeId } = job.data;

    logger.info({ type, dealId, disputeId }, 'Processing timer job');

    if (type === 'dva-expiry' && dealId) {
      await handleDvaExpiry(dealId);
    } else if (type === 'dispute-escalation' && disputeId) {
      await handleDisputeEscalation(disputeId);
    } else {
      logger.error({ jobData: job.data }, 'Unknown timer job type');
    }
  },
  {
    connection: redisClient,
    concurrency: 5,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  }
);

/**
 * Handle DVA expiry - Refund deal if payment not received within DVA_EXPIRY_DAYS
 */
async function handleDvaExpiry(dealId: string): Promise<void> {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { buyer: true, seller: true },
  });

  if (!deal) {
    logger.error({ dealId }, 'Deal not found for DVA expiry');
    return;
  }

  // Only process if still waiting for payment
  if (deal.status !== DealStatus.PAYMENT_PENDING) {
    logger.info(
      { dealId, status: deal.status },
      'Deal status changed, skipping DVA expiry'
    );
    return;
  }

  // Check if DVA has actually expired
  const dvaCreatedAt = deal.dvaCreatedAt || deal.createdAt;
  const expiryDate = new Date(dvaCreatedAt);
  expiryDate.setDate(expiryDate.getDate() + env.DVA_EXPIRY_DAYS);

  if (new Date() < expiryDate) {
    logger.info(
      { dealId, expiryDate },
      'DVA not yet expired, skipping'
    );
    return;
  }

  logger.warn({ dealId, dealRef: deal.dealRef }, 'DVA expired, auto-cancelling deal');

  // Update deal status to cancelled/refunded
  await prisma.deal.update({
    where: { id: dealId },
    data: {
      status: DealStatus.REFUNDED,
      resolvedAt: new Date(),
    },
  });

  await writeAudit({
    dealId,
    action: 'DVA_EXPIRED',
    payload: {
      expiryDate: expiryDate.toISOString(),
      daysWaited: env.DVA_EXPIRY_DAYS,
    },
    actorType: 'system',
  });

  // Notify buyer
  await sendSms({
    to: deal.buyer.phone,
    message: `Deal ${deal.dealRef} has expired. No payment was received within ${env.DVA_EXPIRY_DAYS} days. Deal cancelled.`,
  });

  // Notify seller if exists
  if (deal.seller) {
    await sendSms({
      to: deal.seller.phone,
      message: `Deal ${deal.dealRef} expired due to non-payment. No further action needed.`,
    });
  }
}

/**
 * Handle dispute auto-escalation - Escalate to human if unresolved after DISPUTE_AUTO_ESCALATE_HOURS
 */
async function handleDisputeEscalation(disputeId: string): Promise<void> {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      deal: {
        include: { buyer: true, seller: true },
      },
    },
  });

  if (!dispute) {
    logger.error({ disputeId }, 'Dispute not found for escalation');
    return;
  }

  // Only escalate if still open or in mediation
  if (![DisputeStatus.OPEN, DisputeStatus.MEDIATION].includes(dispute.status)) {
    logger.info(
      { disputeId, status: dispute.status },
      'Dispute already resolved, skipping escalation'
    );
    return;
  }

  // Check if dispute has been open long enough
  const hoursOpen = (Date.now() - dispute.createdAt.getTime()) / (1000 * 60 * 60);
  if (hoursOpen < env.DISPUTE_AUTO_ESCALATE_HOURS) {
    logger.info(
      { disputeId, hoursOpen, threshold: env.DISPUTE_AUTO_ESCALATE_HOURS },
      'Dispute not yet ready for escalation'
    );
    return;
  }

  logger.warn(
    { disputeId, dealRef: dispute.deal.dealRef, hoursOpen },
    'Auto-escalating dispute to human mediator'
  );

  // Escalate to human
  await prisma.dispute.update({
    where: { id: disputeId },
    data: {
      status: DisputeStatus.ESCALATED,
    },
  });

  await writeAudit({
    dealId: dispute.dealId,
    action: 'DISPUTE_AUTO_ESCALATED',
    payload: {
      disputeId,
      hoursOpen: Math.round(hoursOpen),
      reason: 'Unresolved after threshold',
    },
    actorType: 'system',
  });

  // Notify both parties
  const { buyer, seller } = dispute.deal;

  await sendSms({
    to: buyer.phone,
    message: `Dispute for ${dispute.deal.dealRef} has been escalated to our team for manual review. We'll contact you within 24 hours.`,
  });

  if (seller) {
    await sendSms({
      to: seller.phone,
      message: `Dispute for ${dispute.deal.dealRef} has been escalated to our team for manual review. We'll contact you within 24 hours.`,
    });
  }

  // TODO: Send notification to admin dashboard / Slack
  logger.info(
    { disputeId, dealRef: dispute.deal.dealRef },
    'Admin notification: Dispute requires manual resolution'
  );
}

// Worker event handlers
timerWorker.on('completed', (job) => {
  logger.info({ jobId: job.id, type: job.data.type }, 'Timer job completed');
});

timerWorker.on('failed', (job, err) => {
  logger.error(
    { jobId: job?.id, type: job?.data.type, error: err },
    'Timer job failed'
  );
});

timerWorker.on('error', (err) => {
  logger.error({ error: err }, 'Timer worker error');
});

logger.info('⏰ Timer worker initialized');
