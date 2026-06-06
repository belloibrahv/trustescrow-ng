// apps/api/src/services/deal/deal.service.ts
// Central deal state machine. All state transitions happen here.
// Redis distributed lock prevents race conditions per user.
import { DealStatus, type Deal, type User } from '@prisma/client';
import { prisma, writeAudit } from '../../db/prisma';
import { redisClient } from '../../redis/client';
import { logger } from '../../utils/logger';
import { env } from '../../config/env';
import type { AgentResponse } from '../ai-agent/agent.service';
import { verifyNin, verifyBvnWithNin } from '../identity/prembly.service';
import { checkNinRateLimit, checkBvnRateLimit } from '../identity/rate-limit.service';
import { createDva, createPaystackCustomer, transferToRecipient, initiateRefund, bankName } from '../payment/paystack.service';
import { sendSms, sendSmsToBoth, SMS } from '../sms/sms.service';
import { hashNin, encrypt } from '../../utils/crypto';
import { isValidNin, isValidBvn, isValidPhone, parseAmountToKobo, formatNgn } from '../../utils/sanitize';
import { buyerTotalKobo } from './fee.service';
import { timerQueue } from '../../redis/queues';
import { normalisePhone } from '../../utils/sanitize';
import { collectEvidence, canSubmitEvidence } from '../dispute/dispute.service';

// ─── Distributed Lock ─────────────────────────────────────────────────────────

async function withUserLock<T>(phone: string, fn: () => Promise<T>): Promise<T> {
  const lockKey = `lock:user:${phone}`;
  const lockToken = String(Date.now());
  const acquired = await redisClient.set(lockKey, lockToken, 'EX', 10, 'NX');
  if (!acquired) throw new Error('Another request for this user is in progress. Please wait.');
  try {
    return await fn();
  } finally {
    // Only release if we still own the lock
    const current = await redisClient.get(lockKey);
    if (current === lockToken) await redisClient.del(lockKey);
  }
}

// ─── Intent Handler — Main Entry Point ───────────────────────────────────────

type DealWithAll = Deal & { buyer: User; seller: User | null };

export async function handleIntent(
  agentResponse: AgentResponse,
  user: User,
  activeDeal: DealWithAll | null
): Promise<string> {
  return withUserLock(user.phone, () =>
    _handleIntent(agentResponse, user, activeDeal)
  );
}

async function _handleIntent(
  agentResponse: AgentResponse,
  user: User,
  activeDeal: DealWithAll | null
): Promise<string> {
  const { intent, extractedData } = agentResponse;

  // ── No active deal states ──────────────────────────────────────────────────
  if (intent === 'START_DEAL' && !activeDeal) {
    // Create a new deal shell
    await writeAudit({ action: 'DEAL_START_INITIATED', payload: { phone: user.phone }, actorType: 'user', actorId: user.id });
    return SMS.welcome();
  }

  if (intent === 'SUBMIT_SELLER_PHONE' && !activeDeal) {
    const rawPhone = extractedData.phone ?? '';
    if (!isValidPhone(rawPhone)) {
      return 'That doesn\'t look like a valid Nigerian phone number. Please enter a 10 or 11-digit number.';
    }
    const sellerPhone = normalisePhone(rawPhone);
    if (sellerPhone === user.phone) {
      return 'Buyer and seller must be different people. Please enter the seller\'s number, not yours.';
    }

    // Get or create seller user
    const seller = await prisma.user.upsert({
      where: { phone: sellerPhone },
      update: {},
      create: { phone: sellerPhone },
    });

    // Create deal shell
    const deal = await prisma.deal.create({
      data: {
        buyerId: user.id,
        sellerId: seller.id,
        amountKobo: 0n, // Will be set when terms are agreed
        itemDescription: 'Pending',
        status: DealStatus.INITIATED,
      },
    });

    await writeAudit({ dealId: deal.id, action: 'DEAL_CREATED', payload: { buyerPhone: user.phone, sellerPhone }, actorType: 'user', actorId: user.id });

    // Request consent from buyer
    return SMS.consentRequest();
  }

  // ── CONSENT ───────────────────────────────────────────────────────────────
  if (intent === 'CONSENT_YES' && activeDeal?.status === DealStatus.INITIATED) {
    await prisma.user.update({
      where: { id: user.id },
      data: { consentGiven: true, consentTimestamp: new Date() },
    });
    return SMS.askNin();
  }

  if (intent === 'CONSENT_NO') {
    if (activeDeal) {
      await prisma.deal.update({ where: { id: activeDeal.id }, data: { status: DealStatus.REFUNDED } });
    }
    return 'Understood. Your deal has been cancelled. No data was collected. Text START to begin a new deal.';
  }

  // ── NIN SUBMISSION ────────────────────────────────────────────────────────
  if (intent === 'SUBMIT_NIN') {
    const nin = extractedData.nin ?? '';
    const { valid, error } = isValidNin(nin);
    if (!valid) return error!;

    // Rate limit check
    const { allowed, attemptsLeft } = await checkNinRateLimit(user.phone);
    if (!allowed) {
      return `Maximum NIN attempts reached for today. Please try again after 24 hours.`;
    }

    // Self-dealing check — buyer and seller can't have same NIN
    if (activeDeal && activeDeal.status === DealStatus.BUYER_VERIFIED) {
      const buyerNinHash = activeDeal.buyer.ninHash;
      const incomingHash = hashNin(nin);
      if (buyerNinHash && buyerNinHash === incomingHash) {
        return 'Both parties must have different identities. If this is an error, contact support.';
      }
    }

    // Check rate limit before making expensive API call
    const rateLimit = await checkNinRateLimit(user.phone);
    if (!rateLimit.allowed) {
      const hoursLeft = rateLimit.resetAt 
        ? Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / (1000 * 60 * 60))
        : 24;
      return `You've exceeded the maximum number of NIN verification attempts (${env.MAX_NIN_ATTEMPTS}). Please try again in ${hoursLeft} hours.`;
    }

    try {
      const result = await verifyNin(nin);
      if (!result.success) {
        // Show remaining attempts on failure
        return SMS.ninFailed(result.error!) + ` (${rateLimit.attemptsLeft} attempts remaining)`;
      }

      // Persist hash (never raw NIN)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          ninHash: hashNin(nin),
          nimcRef: result.nimcRef,
          fullName: result.fullName,
          dateOfBirth: result.dob,
          gender: result.gender,
        },
      });

      // Advance deal state
      if (activeDeal) {
        const nextStatus = activeDeal.buyerId === user.id
          ? DealStatus.BUYER_VERIFIED
          : DealStatus.BOTH_VERIFIED;
        await prisma.deal.update({ where: { id: activeDeal.id }, data: { status: nextStatus } });
        await writeAudit({ dealId: activeDeal.id, action: 'NIN_VERIFIED', payload: { role: activeDeal.buyerId === user.id ? 'buyer' : 'seller' }, actorType: 'user', actorId: user.id });
      }

      return SMS.ninConfirmed(result.fullName!);
    } catch (err) {
      logger.error(err, 'NIN verification error');
      return SMS.verificationDelayed();
    }
  }

  // ── BVN SUBMISSION ────────────────────────────────────────────────────────
  if (intent === 'SUBMIT_BVN') {
    const bvn = extractedData.bvn ?? '';
    const { valid, error } = isValidBvn(bvn);
    if (!valid) return error!;
    if (!user.ninHash || !user.nimcRef) return 'Please complete NIN verification first.';

    // Check rate limit before making expensive API call
    const rateLimit = await checkBvnRateLimit(user.phone);
    if (!rateLimit.allowed) {
      const hoursLeft = rateLimit.resetAt 
        ? Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / (1000 * 60 * 60))
        : 24;
      return `You've exceeded the maximum number of BVN verification attempts (${env.MAX_NIN_ATTEMPTS}). Please try again in ${hoursLeft} hours.`;
    }

    try {
      const result = await verifyBvnWithNin(bvn, '', user.fullName ?? '');
      if (!result.success) {
        return SMS.bvnFailed(result.error!) + ` (${rateLimit.attemptsLeft} attempts remaining)`;
      }

      if (!result.nameMatch) {
        return `Your BVN name doesn't match your NIN name (similarity: ${Math.round(result.nameScore * 100)}%). Please contact support if this is an error.`;
      }

      // Encrypt and persist bank details
      await prisma.user.update({
        where: { id: user.id },
        data: {
          bvnVerified: true,
          bankCode: result.bankCode,
          bankAccountNumberEnc: result.accountNumber ? encrypt(result.accountNumber) : undefined,
        },
      });

      // Create Paystack transfer recipient
      if (result.bankCode && result.accountNumber && user.fullName) {
        const recipientCode = await createPaystackCustomer({
          phone: user.phone, firstName: user.fullName.split(' ')[0], lastName: user.fullName.split(' ').slice(1).join(' ')
        });
        await prisma.user.update({ where: { id: user.id }, data: { paystackCustomerId: recipientCode.customerId } });
      }

      if (activeDeal) {
        const nextStatus = activeDeal.buyerId === user.id
          ? (activeDeal.seller?.bvnVerified ? DealStatus.BOTH_VERIFIED : DealStatus.BUYER_VERIFIED)
          : DealStatus.BOTH_VERIFIED;
        await prisma.deal.update({ where: { id: activeDeal.id }, data: { status: nextStatus } });
      }

      return SMS.bvnConfirmed();
    } catch (err) {
      logger.error(err, 'BVN verification error');
      return SMS.verificationDelayed();
    }
  }

  // ── TERMS AGREEMENT ───────────────────────────────────────────────────────
  if (intent === 'TERMS_YES' && activeDeal?.status === DealStatus.TERMS_AGREED) {
    // Create Paystack DVA
    if (!user.fullName) return 'Identity verification required before payment. Please re-verify.';
    const parts = user.fullName.split(' ');
    const dva = await createDva({
      phone: user.phone,
      firstName: parts[0],
      lastName: parts.slice(1).join(' ') || 'N/A',
      paystackCustomerId: user.paystackCustomerId ?? undefined,
    });

    const expiresAt = new Date(Date.now() + env.DVA_EXPIRY_DAYS * 86_400_000);
    await prisma.deal.update({
      where: { id: activeDeal.id },
      data: {
        status: DealStatus.PAYMENT_PENDING,
        dvaAccountNumber: dva.accountNumber,
        dvaBankName: dva.bankName,
        dvaExpiresAt: expiresAt,
        paystackDvaId: dva.dvaId,
      },
    });

    // Schedule DVA expiry reminder (5 days) and expiry (7 days)
    await timerQueue.add('dva-reminder', { dealId: activeDeal.id }, { delay: (env.DVA_EXPIRY_DAYS - 2) * 86_400_000 });
    await timerQueue.add('dva-expire', { dealId: activeDeal.id }, { delay: env.DVA_EXPIRY_DAYS * 86_400_000 });

    const totals = buyerTotalKobo(activeDeal.amountKobo);
    return SMS.paymentInstructions(
      formatNgn(totals.total),
      dva.accountNumber,
      dva.bankName,
      activeDeal.dealRef
    );
  }

  // ── RECEIVED (Buyer confirms delivery) ────────────────────────────────────
  if (intent === 'RECEIVED' && activeDeal?.status === DealStatus.AWAITING_CONFIRMATION) {
    if (activeDeal.buyerId !== user.id) return 'Only the buyer can confirm delivery.';

    // Release funds to seller
    const seller = activeDeal.seller;
    if (!seller?.paystackCustomerId) {
      return 'Seller bank details not found. Please contact support to release funds.';
    }

    await prisma.deal.update({ where: { id: activeDeal.id }, data: { status: DealStatus.COMPLETED } });

    // Transfer (fire and forget — tracked via webhook)
    try {
      const transfer = await transferToRecipient({
        recipientCode: seller.paystackCustomerId,
        amountKobo: activeDeal.amountKobo,
        dealId: activeDeal.id,
        reason: `TrustEscrow ${activeDeal.dealRef}`,
      });
      await prisma.deal.update({ where: { id: activeDeal.id }, data: { paystackTransferId: transfer.transferCode, resolvedAt: new Date() } });
      await writeAudit({ dealId: activeDeal.id, action: 'FUNDS_RELEASED', payload: { transferCode: transfer.transferCode }, actorType: 'system' });
    } catch (err) {
      logger.error(err, 'Fund release failed — requires manual intervention');
      await writeAudit({ dealId: activeDeal.id, action: 'FUNDS_RELEASE_FAILED', payload: { error: (err as Error).message }, actorType: 'system' });
    }

    await sendSms({ to: seller.phone, message: SMS.sellerFundsReleased(formatNgn(activeDeal.amountKobo), activeDeal.dealRef), dealRef: activeDeal.dealRef });
    await prisma.user.update({ where: { id: user.id }, data: { dealCount: { increment: 1 } } });
    return SMS.buyerDealComplete(activeDeal.dealRef);
  }

  // ── DISPUTE ───────────────────────────────────────────────────────────────
  if (intent === 'DISPUTE' && activeDeal?.status === DealStatus.AWAITING_CONFIRMATION) {
    await prisma.deal.update({ where: { id: activeDeal.id }, data: { status: DealStatus.DISPUTE_OPEN } });
    await prisma.dispute.create({ data: { dealId: activeDeal.id, openedById: user.id } });

    // Schedule auto-escalation
    await timerQueue.add('dispute-escalate', { dealId: activeDeal.id }, { delay: env.DISPUTE_AUTO_ESCALATE_HOURS * 3_600_000 });

    await writeAudit({ dealId: activeDeal.id, action: 'DISPUTE_OPENED', payload: { openedBy: user.phone }, actorType: 'user', actorId: user.id });

    const otherParty = activeDeal.buyerId === user.id ? activeDeal.seller : activeDeal.buyer;
    if (otherParty) {
      await sendSms({ to: otherParty.phone, message: `A dispute has been raised for deal ${activeDeal.dealRef}. Funds are frozen. Please submit your evidence by SMS.`, dealRef: activeDeal.dealRef });
    }
    return SMS.disputeOpened(activeDeal.dealRef);
  }

  // ── SUBMIT EVIDENCE ───────────────────────────────────────────────────────
  if (intent === 'SUBMIT_EVIDENCE' && activeDeal) {
    const dispute = await prisma.dispute.findUnique({
      where: { dealId: activeDeal.id },
    });

    if (!dispute) {
      return 'No active dispute for this deal.';
    }

    const canSubmit = await canSubmitEvidence(dispute.id, user.id);
    if (!canSubmit) {
      return 'You cannot submit evidence at this time. The dispute may already be resolved.';
    }

    const evidenceText = agentResponse.extractedData.evidenceText as string || agentResponse.extractedData.text as string;
    if (!evidenceText || evidenceText.length < 10) {
      return 'Please provide detailed evidence (at least 10 characters). Describe what happened with the deal.';
    }

    try {
      const result = await collectEvidence(dispute.id, user.id, evidenceText);
      return result.message;
    } catch (err) {
      logger.error({ err, disputeId: dispute.id }, 'Failed to collect evidence');
      return 'Failed to submit evidence. Please try again or contact support.';
    }
  }

  // ── STATUS ────────────────────────────────────────────────────────────────
  if (intent === 'STATUS') {
    if (!activeDeal) return 'You have no active deal. Text START to begin a new deal.';
    return SMS.statusReport(activeDeal.dealRef, activeDeal.status, formatNgn(activeDeal.amountKobo));
  }

  // ── CANCEL ────────────────────────────────────────────────────────────────
  if (intent === 'CANCEL') {
    if (!activeDeal) return 'No active deal to cancel.';
    if (['FUNDS_HELD', 'AWAITING_CONFIRMATION', 'COMPLETED', 'REFUNDED'].includes(activeDeal.status)) {
      return 'Deal cannot be cancelled at this stage. Text DISPUTE if there is a problem.';
    }
    await prisma.deal.update({ where: { id: activeDeal.id }, data: { status: DealStatus.REFUNDED, resolvedAt: new Date() } });
    return `Deal ${activeDeal.dealRef} cancelled. No funds were moved.`;
  }

  // ── Default fallback ──────────────────────────────────────────────────────
  if (agentResponse.requiresClarification) {
    return agentResponse.replyMessage;
  }

  return 'Sorry, I didn\'t understand that. Reply STATUS to check your deal, or START to begin a new deal.';
}
