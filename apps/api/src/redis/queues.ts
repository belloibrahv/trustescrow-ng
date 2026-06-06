// apps/api/src/redis/queues.ts
import { Queue } from 'bullmq';
import { redisClient } from './client';

const connection = redisClient;

// Queue: inbound SMS processing
export const smsQueue = new Queue('sms-queue', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5_000 }, // 5s → 25s → 125s
    removeOnComplete: { count: 1000, age: 86_400 }, // keep 1000 or 24h
    removeOnFail: { count: 500 },
  },
});

// Queue: identity verification (NIN + BVN via Prembly)
export const identityQueue = new Queue('identity-queue', {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 60_000 }, // 1min → 5min → 25min...
    removeOnComplete: { age: 86_400 },
    removeOnFail: { count: 200 },
  },
});

// Queue: payment operations (DVA creation, fund transfers, refunds)
export const paymentQueue = new Queue('payment-queue', {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 10_000 },
    removeOnComplete: { age: 604_800 }, // 7 days for payment audit
    removeOnFail: { count: 500 },
  },
});

// Queue: outbound SMS sending (with fallback to Twilio)
export const outboundSmsQueue = new Queue('outbound-sms-queue', {
  connection,
  defaultJobOptions: {
    attempts: 4,
    backoff: { type: 'exponential', delay: 10_000 },
    removeOnComplete: { count: 5000, age: 86_400 },
    removeOnFail: { count: 500 },
  },
});

// Queue: deal timers (DVA expiry, dispute auto-escalation)
export const timerQueue = new Queue('timer-queue', {
  connection,
  defaultJobOptions: {
    removeOnComplete: { age: 86_400 },
    removeOnFail: { count: 100 },
  },
});

// ─── Helper Functions for Timer Queue ────────────────────────────────────────

/**
 * Schedule DVA expiry check
 * Runs after DVA_EXPIRY_DAYS from DVA creation
 */
export async function scheduleDvaExpiry(dealId: string, dvaCreatedAt: Date): Promise<void> {
  const delayMs = Number(process.env.DVA_EXPIRY_DAYS || 7) * 24 * 60 * 60 * 1000;
  
  await timerQueue.add(
    'dva-expiry',
    {
      type: 'dva-expiry' as const,
      dealId,
    },
    {
      delay: delayMs,
      jobId: `dva-expiry-${dealId}`, // Ensure idempotency
    }
  );
}

/**
 * Schedule dispute auto-escalation
 * Runs after DISPUTE_AUTO_ESCALATE_HOURS from dispute creation
 */
export async function scheduleDisputeEscalation(disputeId: string, dealId: string): Promise<void> {
  const delayMs = Number(process.env.DISPUTE_AUTO_ESCALATE_HOURS || 48) * 60 * 60 * 1000;
  
  await timerQueue.add(
    'dispute-escalation',
    {
      type: 'dispute-escalation' as const,
      disputeId,
      dealId,
    },
    {
      delay: delayMs,
      jobId: `dispute-escalation-${disputeId}`, // Ensure idempotency
    }
  );
}

/**
 * Cancel scheduled DVA expiry (called when payment is received)
 */
export async function cancelDvaExpiry(dealId: string): Promise<void> {
  const jobId = `dva-expiry-${dealId}`;
  const job = await timerQueue.getJob(jobId);
  if (job) {
    await job.remove();
  }
}

/**
 * Cancel scheduled dispute escalation (called when dispute is resolved)
 */
export async function cancelDisputeEscalation(disputeId: string): Promise<void> {
  const jobId = `dispute-escalation-${disputeId}`;
  const job = await timerQueue.getJob(jobId);
  if (job) {
    await job.remove();
  }
}
