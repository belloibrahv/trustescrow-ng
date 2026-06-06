// apps/api/src/workers/sms.worker.ts
import { Worker, type Job } from 'bullmq';
import { redisClient } from '../redis/client';
import { prisma } from '../db/prisma';
import { buildAgentContext, callClaudeAgent } from '../services/ai-agent/agent.service';
import { handleIntent } from '../services/deal/deal.service';
import { sendSms, SMS } from '../services/sms/sms.service';
import { logger } from '../utils/logger';
import { normalisePhone } from '../utils/sanitize';
import type { DealStatus } from '@prisma/client';

interface SmsJobData {
  phone: string;
  text: string;
  messageId: string;
  shortcode: string;
}

type DealNotCompleted = Exclude<DealStatus, 'COMPLETED' | 'REFUNDED'>;
const ACTIVE_STATUSES: DealStatus[] = [
  'INITIATED', 'BUYER_VERIFIED', 'BOTH_VERIFIED', 'TERMS_AGREED',
  'PAYMENT_PENDING', 'FUNDS_HELD', 'AWAITING_CONFIRMATION',
  'DISPUTE_OPEN', 'MEDIATION', 'ESCALATED',
];

export const smsWorker = new Worker<SmsJobData>(
  'sms-queue',
  async (job: Job<SmsJobData>) => {
    const { phone, text, messageId } = job.data;
    const normalisedPhone = normalisePhone(phone);

    logger.info({ phone: normalisedPhone, messageId, intent: 'pending' }, 'Processing inbound SMS');

    // ── 1. Get or create user ───────────────────────────────────────────────
    const user = await prisma.user.upsert({
      where: { phone: normalisedPhone },
      update: {},
      create: { phone: normalisedPhone },
    });

    // ── 2. Fetch active deal with relations ─────────────────────────────────
    const activeDeal = await prisma.deal.findFirst({
      where: {
        status: { in: ACTIVE_STATUSES },
        OR: [{ buyerId: user.id }, { sellerId: user.id }],
      },
      include: {
        buyer: true,
        seller: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // ── 3. Log inbound message ──────────────────────────────────────────────
    await prisma.message.create({
      data: {
        userId: user.id,
        dealId: activeDeal?.id ?? null,
        direction: 'INBOUND',
        body: text,
        atMessageId: messageId,
      },
    });

    // ── 4. Build context and call Claude ────────────────────────────────────
    const context = buildAgentContext(user, activeDeal, text);
    const agentResponse = await callClaudeAgent(context);

    logger.info(
      { phone: normalisedPhone, intent: agentResponse.intent, confidence: agentResponse.confidence },
      'Claude intent classified'
    );

    // ── 5. Handle intent → get reply ────────────────────────────────────────
    let replyText: string;
    try {
      replyText = await handleIntent(agentResponse, user, activeDeal as any);
    } catch (err) {
      logger.error(err, 'Intent handler error');
      replyText = SMS.genericError();
    }

    // ── 6. Send reply SMS ───────────────────────────────────────────────────
    await sendSms({
      to: normalisedPhone,
      message: replyText,
      dealRef: activeDeal?.dealRef,
    });

    // ── 7. Log outbound message ─────────────────────────────────────────────
    // Re-fetch deal in case it was just created
    const updatedDeal = activeDeal ?? await prisma.deal.findFirst({
      where: { buyerId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    await prisma.message.create({
      data: {
        userId: user.id,
        dealId: updatedDeal?.id ?? null,
        direction: 'OUTBOUND',
        body: replyText,
        intent: agentResponse.intent,
        claudeResponse: agentResponse as any,
      },
    });
  },
  {
    connection: redisClient,
    concurrency: 10, // Process up to 10 SMS jobs simultaneously
  }
);

smsWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'SMS job completed');
});

smsWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err: err.message }, 'SMS job failed');
});
