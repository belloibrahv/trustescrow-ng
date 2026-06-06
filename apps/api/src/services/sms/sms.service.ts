// apps/api/src/services/sms/sms.service.ts
import AfricasTalking from 'africastalking';
import twilio from 'twilio';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { truncateSms, normalisePhone } from '../../utils/sanitize';

// ─── AT SDK Init ─────────────────────────────────────────────────────────────
// username = 'sandbox' in dev; real username in prod
const hasAfricaTalkingCredentials = Boolean(env.AT_API_KEY && env.AT_USERNAME);
const atSms = hasAfricaTalkingCredentials
  ? AfricasTalking({
      apiKey: env.AT_API_KEY,
      username: env.AT_USERNAME,
    }).SMS
  : null;

if (!hasAfricaTalkingCredentials) {
  logger.warn('Africa\'s Talking credentials missing — SMS will use fallback providers only');
}

// ─── Twilio Init (fallback) ──────────────────────────────────────────────────
const twilioClient =
  env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN
    ? twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN)
    : null;

// ─── Send SMS ────────────────────────────────────────────────────────────────

export interface SendSmsParams {
  to: string;         // Raw phone number (any format)
  message: string;    // Will be truncated to 160 chars
  dealRef?: string;   // For logging
}

export async function sendSms(params: SendSmsParams): Promise<void> {
  const message = truncateSms(params.message);
  const to = normalisePhone(params.to);

  // Primary: Africa's Talking
  if (atSms && env.AT_SHORTCODE) {
    try {
      await atSms.send({
        to: [to],
        message,
        from: env.AT_SHORTCODE,
      });
      logger.info({ to, dealRef: params.dealRef, chars: message.length }, 'SMS sent via AT');
      return;
    } catch (atErr) {
      logger.warn({ err: (atErr as Error).message, to }, 'AT SMS failed — trying Twilio fallback');
    }
  }

  // Fallback: Twilio
  if (!twilioClient || !env.TWILIO_FROM_NUMBER) {
    logger.error({ to }, 'No SMS fallback available — Twilio not configured');
    throw new Error('SMS delivery failed and no fallback is configured');
  }

  try {
    await twilioClient.messages.create({
      body: message,
      from: env.TWILIO_FROM_NUMBER,
      to,
    });
    logger.info({ to, dealRef: params.dealRef }, 'SMS sent via Twilio fallback');
  } catch (twilioErr) {
    logger.error({ err: (twilioErr as Error).message, to }, 'Twilio SMS also failed');
    throw twilioErr;
  }
}

// ─── Bulk SMS (both parties simultaneously) ──────────────────────────────────

export async function sendSmsToBoth(params: {
  buyerPhone: string;
  sellerPhone: string;
  message: string;
  dealRef?: string;
}): Promise<void> {
  await Promise.allSettled([
    sendSms({ to: params.buyerPhone, message: params.message, dealRef: params.dealRef }),
    sendSms({ to: params.sellerPhone, message: params.message, dealRef: params.dealRef }),
  ]);
}

// ─── SMS Templates ───────────────────────────────────────────────────────────
// All templates are strictly ≤160 chars

export const SMS = {
  welcome: () =>
    'Welcome to TrustEscrow NG. Safe deals via SMS. Enter seller\'s phone number to begin.',

  consentRequest: () =>
    'TrustEscrow collects your NIN & BVN per NDPR to verify identity. Reply YES to consent or NO to cancel.',

  askNin: () => 'Please enter your 11-digit National Identification Number (NIN).',

  ninConfirmed: (name: string) =>
    truncateSms(`Identity confirmed: ${name}. Please enter your 10-digit BVN.`),

  ninFailed: (error: string) => truncateSms(error),

  bvnConfirmed: () =>
    'Bank identity verified. Please describe the deal in one line (item + price, e.g. iPhone 14, 80000 naira).',

  bvnFailed: (error: string) => truncateSms(error),

  notifySellerOfDeal: (dealRef: string, item: string, amount: string) =>
    truncateSms(`${dealRef}: A buyer wants ${item} for ${amount}. Reply YES to accept or NO to decline.`),

  termsLocked: (item: string, amount: string) =>
    truncateSms(`Terms locked: ${item}, ${amount}. Buyer must pay within 24hrs. Reply STATUS anytime.`),

  paymentInstructions: (amount: string, accountNumber: string, bankName: string, dealRef: string) =>
    truncateSms(`Pay ${amount} to: ${bankName} ${accountNumber}. Ref: ${dealRef}`),

  fundsReceived: (dealRef: string) =>
    truncateSms(`FUNDS RECEIVED for ${dealRef}. Money is in escrow. Seller: proceed to deliver. Buyer: text RECEIVED when done.`),

  sellerFundsReleased: (amount: string, dealRef: string) =>
    truncateSms(`Deal complete. ${amount} sent to your account. Ref: ${dealRef}. Thank you!`),

  buyerDealComplete: (dealRef: string) =>
    truncateSms(`Deal ${dealRef} complete. Funds released to seller. Thank you for using TrustEscrow NG!`),

  disputeOpened: (dealRef: string) =>
    truncateSms(`Dispute opened for ${dealRef}. Funds frozen. Please describe what happened in your next message.`),

  disputeEscalated: () =>
    'Your dispute has been escalated to a human mediator. They will review within 24hrs. Funds remain frozen.',

  dvaExpiringSoon: (dealRef: string, hours: number) =>
    truncateSms(`Reminder: You have ${hours}hrs to pay for deal ${dealRef} before it expires.`),

  dealExpired: (dealRef: string) =>
    truncateSms(`Deal ${dealRef} has expired due to non-payment. Both parties may restart if still interested.`),

  statusReport: (dealRef: string, status: string, amount: string) =>
    truncateSms(`Deal ${dealRef}: Status=${status}, Amount=${amount}. Reply DISPUTE or RECEIVED if needed.`),

  genericError: () =>
    'Something went wrong on our end. We are looking into it. Please try again in a few minutes.',

  verificationDelayed: () =>
    'Our identity check is delayed. We will retry automatically — no action needed from you.',
};
