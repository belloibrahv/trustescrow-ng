// apps/api/src/services/dispute/dispute.service.ts
import { prisma, writeAudit } from '../../db/prisma';
import { DisputeStatus, DealStatus } from '@prisma/client';
import { callClaudeAgent } from '../ai-agent/agent.service';
import { transferToRecipient, initiateRefund } from '../payment/paystack.service';
import { sendSms, SMS } from '../sms/sms.service';
import { formatNgn } from '../../utils/sanitize';
import { logger } from '../../utils/logger';

interface DisputeWithDeal {
  id: string;
  dealId: string;
  openedById: string;
  reason?: string;
  buyerEvidence?: string;
  sellerEvidence?: string;
  status: DisputeStatus;
  deal: {
    id: string;
    dealRef: string;
    amountKobo: bigint;
    feeKobo: bigint;
    itemDescription: string;
    buyerId: string;
    sellerId: string;
    paystackChargeRef?: string;
    buyer: {
      id: string;
      phone: string;
      fullName?: string;
      paystackCustomerId?: string;
    };
    seller: {
      id: string;
      phone: string;
      fullName?: string;
      paystackCustomerId?: string;
    };
  };
}

/**
 * Collect evidence from buyer or seller via SMS
 */
export async function collectEvidence(
  disputeId: string,
  userId: string,
  evidenceText: string
): Promise<{ success: boolean; message: string }> {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      deal: {
        include: { buyer: true, seller: true },
      },
    },
  }) as DisputeWithDeal | null;

  if (!dispute) {
    return { success: false, message: 'Dispute not found' };
  }

  // Determine if this is buyer or seller
  const role = dispute.deal.buyerId === userId ? 'buyer' : 'seller';
  const evidenceField = role === 'buyer' ? 'buyerEvidence' : 'sellerEvidence';

  // Update evidence
  await prisma.dispute.update({
    where: { id: disputeId },
    data: { [evidenceField]: evidenceText },
  });

  await writeAudit({
    dealId: dispute.dealId,
    action: `DISPUTE_EVIDENCE_SUBMITTED_${role.toUpperCase()}`,
    payload: { evidenceLength: evidenceText.length },
    actorType: 'user',
    actorId: userId,
  });

  logger.info({ disputeId, role }, 'Evidence submitted');

  // Check if both parties have submitted evidence
  const updated = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      deal: {
        include: { buyer: true, seller: true },
      },
    },
  }) as DisputeWithDeal;

  if (updated.buyerEvidence && updated.sellerEvidence) {
    // Both parties submitted — attempt AI mediation
    logger.info({ disputeId }, 'Both parties submitted evidence, starting AI mediation');
    await attemptAiMediation(updated);
    return {
      success: true,
      message: 'Evidence submitted. AI is reviewing both sides now. You will receive the decision via SMS.',
    };
  }

  // Waiting for other party
  const otherParty = role === 'buyer' ? dispute.deal.seller : dispute.deal.buyer;
  await sendSms({
    to: otherParty.phone,
    message: `${role === 'buyer' ? 'Buyer' : 'Seller'} submitted evidence for dispute ${dispute.deal.dealRef}. Reply with your evidence.`,
    dealRef: dispute.deal.dealRef,
  });

  return {
    success: true,
    message: 'Evidence submitted. Waiting for other party to submit their evidence.',
  };
}

/**
 * Attempt AI-powered mediation using Claude
 */
async function attemptAiMediation(dispute: DisputeWithDeal): Promise<void> {
  const { deal } = dispute;

  // Build mediation prompt
  const mediationPrompt = `
You are mediating an escrow dispute. Review both parties' evidence and decide who should receive the funds.

**Deal Information:**
- Item: ${deal.itemDescription}
- Amount: ₦${Number(deal.amountKobo) / 100}
- Deal Ref: ${deal.dealRef}

**Buyer Evidence:**
${dispute.buyerEvidence || 'No evidence provided'}

**Seller Evidence:**
${dispute.sellerEvidence || 'No evidence provided'}

**Instructions:**
1. Analyze both sides objectively
2. Consider: delivery proof, communication history, item condition claims
3. If evidence is clear, decide for buyer or seller
4. If unclear or both have valid points, mark as "unclear" for human review

**Response Format (JSON only):**
{
  "decision": "buyer" | "seller" | "unclear",
  "reasoning": "brief 2-3 sentence explanation",
  "confidence": 0.0-1.0
}
`;

  try {
    const aiResponse = await callClaudeAgent(mediationPrompt);
    const result = JSON.parse(aiResponse.replyMessage || aiResponse.extractedData?.response || '{}');

    logger.info({ disputeId: dispute.id, result }, 'AI mediation result');

    // Store AI assessment
    await prisma.dispute.update({
      where: { id: dispute.id },
      data: {
        aiAssessment: result.reasoning,
        status: DisputeStatus.UNDER_REVIEW,
      },
    });

    // If confidence is too low or decision is unclear, escalate to human
    if (result.confidence < 0.7 || result.decision === 'unclear') {
      await escalateToHuman(dispute, result.reasoning);
      return;
    }

    // AI is confident — execute the decision
    await executeDisputeDecision(dispute, result.decision, result.reasoning, 'ai');
  } catch (error) {
    logger.error({ error, disputeId: dispute.id }, 'AI mediation failed');
    // Fallback: escalate to human
    await escalateToHuman(dispute, 'AI mediation error — requires human review');
  }
}

/**
 * Escalate dispute to human mediator
 */
async function escalateToHuman(dispute: DisputeWithDeal, reason: string): Promise<void> {
  await prisma.dispute.update({
    where: { id: dispute.id },
    data: {
      status: DisputeStatus.ESCALATED,
      aiAssessment: reason,
    },
  });

  await prisma.deal.update({
    where: { id: dispute.dealId },
    data: { status: DealStatus.ESCALATED },
  });

  await writeAudit({
    dealId: dispute.dealId,
    action: 'DISPUTE_ESCALATED_TO_HUMAN',
    payload: { reason },
    actorType: 'system',
  });

  // Notify both parties
  const message = SMS.disputeEscalated();
  await sendSms({ to: dispute.deal.buyer.phone, message, dealRef: dispute.deal.dealRef });
  await sendSms({ to: dispute.deal.seller.phone, message, dealRef: dispute.deal.dealRef });

  logger.info({ disputeId: dispute.id }, 'Dispute escalated to human mediator');
}

/**
 * Execute dispute decision (release funds or refund)
 */
export async function executeDisputeDecision(
  dispute: DisputeWithDeal,
  decision: 'buyer' | 'seller',
  resolution: string,
  decidedBy: 'ai' | 'human'
): Promise<void> {
  const { deal } = dispute;

  logger.info({ disputeId: dispute.id, decision, decidedBy }, 'Executing dispute decision');

  if (decision === 'seller') {
    // Release funds to seller
    if (!deal.seller.paystackCustomerId) {
      throw new Error('Seller has no Paystack recipient code');
    }

    await transferToRecipient({
      recipientCode: deal.seller.paystackCustomerId,
      amountKobo: deal.amountKobo,
      dealId: deal.id,
      reason: `TrustEscrow dispute resolution ${deal.dealRef}`,
    });

    await sendSms({
      to: deal.seller.phone,
      message: `Dispute resolved in your favor. ${formatNgn(deal.amountKobo)} released to your account. Ref: ${deal.dealRef}`,
      dealRef: deal.dealRef,
    });

    await sendSms({
      to: deal.buyer.phone,
      message: `Dispute resolved. Funds released to seller for ${deal.dealRef}. ${resolution}`,
      dealRef: deal.dealRef,
    });

    await prisma.deal.update({
      where: { id: deal.id },
      data: { status: DealStatus.COMPLETED, resolvedAt: new Date() },
    });
  } else {
    // Refund buyer
    if (!deal.paystackChargeRef) {
      throw new Error('No charge reference for refund');
    }

    await initiateRefund({ chargeReference: deal.paystackChargeRef });

    await sendSms({
      to: deal.buyer.phone,
      message: `Dispute resolved in your favor. Refund of ${formatNgn(deal.amountKobo)} initiated. Allow 3-7 business days. Ref: ${deal.dealRef}`,
      dealRef: deal.dealRef,
    });

    await sendSms({
      to: deal.seller.phone,
      message: `Dispute resolved. Refund issued to buyer for ${deal.dealRef}. ${resolution}`,
      dealRef: deal.dealRef,
    });

    await prisma.deal.update({
      where: { id: deal.id },
      data: { status: DealStatus.REFUNDED, resolvedAt: new Date() },
    });
  }

  // Update dispute status
  await prisma.dispute.update({
    where: { id: dispute.id },
    data: {
      status: DisputeStatus.RESOLVED,
      resolution,
      resolvedFor: decision,
      resolvedAt: new Date(),
    },
  });

  await writeAudit({
    dealId: deal.id,
    action: 'DISPUTE_RESOLVED',
    payload: { decision, decidedBy, resolution },
    actorType: decidedBy === 'ai' ? 'system' : 'admin',
  });

  logger.info({ disputeId: dispute.id, decision }, 'Dispute resolved successfully');
}

/**
 * Check if user can submit evidence
 */
export async function canSubmitEvidence(disputeId: string, userId: string): Promise<boolean> {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: { deal: true },
  });

  if (!dispute) return false;

  // User must be buyer or seller
  const isParty =
    dispute.deal.buyerId === userId || dispute.deal.sellerId === userId;

  // Dispute must be open or under review
  const isOpen = ['OPEN', 'UNDER_REVIEW'].includes(dispute.status);

  return isParty && isOpen;
}
