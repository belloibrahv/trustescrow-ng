// apps/api/src/services/payment/paystack.service.ts
import axios, { type AxiosError } from 'axios';
import crypto from 'crypto';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

const PAYSTACK_BASE = 'https://api.paystack.co';
const headers = {
  Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
  'Content-Type': 'application/json',
};

// ─── Webhook Validation ───────────────────────────────────────────────────────

/**
 * MUST be called before processing any Paystack webhook.
 * Rejects unsigned or tampered events.
 */
export function validatePaystackWebhook(rawBody: string, signature: string): boolean {
  const hash = crypto
    .createHmac('sha512', env.PAYSTACK_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  return hash === signature;
}

// ─── Customer Creation ────────────────────────────────────────────────────────

export interface PaystackCustomer {
  customerId: string;
  email: string;
}

export async function createPaystackCustomer(params: {
  phone: string;
  firstName: string;
  lastName: string;
}): Promise<PaystackCustomer> {
  // Paystack requires email — we derive a synthetic one from phone
  const email = `${params.phone.replace('+', '')}@trustescrow.ng`;

  const { data } = await axios.post(
    `${PAYSTACK_BASE}/customer`,
    {
      email,
      first_name: params.firstName,
      last_name: params.lastName,
      phone: params.phone,
    },
    { headers, timeout: 15_000 }
  );

  return { customerId: data.data.customer_code, email };
}

// ─── Dedicated Virtual Account ────────────────────────────────────────────────

export interface DvaResult {
  customerId: string;
  accountNumber: string;
  bankName: string;
  dvaId: string;
}

export async function createDva(params: {
  phone: string;
  firstName: string;
  lastName: string;
  paystackCustomerId?: string;
}): Promise<DvaResult> {
  const email = `${params.phone.replace('+', '')}@trustescrow.ng`;

  const { data } = await axios.post(
    `${PAYSTACK_BASE}/dedicated_account/assign`,
    {
      email,
      first_name: params.firstName,
      last_name: params.lastName,
      phone: params.phone,
      customer: params.paystackCustomerId,
      preferred_bank: env.PAYSTACK_DVA_PROVIDER,
    },
    { headers, timeout: 30_000 }
  );

  return {
    customerId: data.data.customer?.customer_code ?? params.paystackCustomerId ?? '',
    accountNumber: data.data.account_number,
    bankName: data.data.bank?.name ?? env.PAYSTACK_DVA_PROVIDER,
    dvaId: String(data.data.id),
  };
}

// ─── Transfer Recipient Creation ──────────────────────────────────────────────

export async function createTransferRecipient(params: {
  name: string;
  accountNumber: string;
  bankCode: string;
}): Promise<string> { // Returns recipient_code
  const { data } = await axios.post(
    `${PAYSTACK_BASE}/transferrecipient`,
    {
      type: 'nuban',
      name: params.name,
      account_number: params.accountNumber,
      bank_code: params.bankCode,
      currency: 'NGN',
    },
    { headers, timeout: 15_000 }
  );

  return data.data.recipient_code;
}

// ─── Fund Transfer (Release to Seller) ───────────────────────────────────────

export interface TransferResult {
  transferCode: string;
  reference: string;
  status: string;
}

export async function transferToRecipient(params: {
  recipientCode: string;
  amountKobo: bigint;
  dealId: string; // Used as idempotency key — CRITICAL
  reason: string;
}): Promise<TransferResult> {
  try {
    const { data } = await axios.post(
      `${PAYSTACK_BASE}/transfer`,
      {
        source: 'balance',
        amount: Number(params.amountKobo),
        recipient: params.recipientCode,
        reference: params.dealId, // Idempotency key — same deal ID always produces same result
        reason: params.reason,
        currency: 'NGN',
      },
      { headers, timeout: 30_000 }
    );

    return {
      transferCode: data.data.transfer_code,
      reference: data.data.reference,
      status: data.data.status,
    };
  } catch (err) {
    const axErr = err as AxiosError<{ message?: string }>;
    // If transfer already exists with this reference, that's fine (idempotent)
    if (axErr.response?.data?.message?.includes('reference already exists')) {
      logger.warn({ dealId: params.dealId }, 'Duplicate transfer reference — already processed');
      return { transferCode: 'DUPLICATE', reference: params.dealId, status: 'success' };
    }
    throw err;
  }
}

// ─── Refund ───────────────────────────────────────────────────────────────────

export async function initiateRefund(params: {
  chargeReference: string;
  amountKobo?: bigint; // Partial refund if specified; full refund if omitted
}): Promise<{ refundId: string; status: string }> {
  const body: Record<string, unknown> = { transaction: params.chargeReference };
  if (params.amountKobo) body.amount = Number(params.amountKobo);

  const { data } = await axios.post(
    `${PAYSTACK_BASE}/refund`,
    body,
    { headers, timeout: 15_000 }
  );

  return { refundId: String(data.data.id), status: data.data.status };
}

// ─── Bank Code Lookup ─────────────────────────────────────────────────────────

// Common Nigerian bank codes for reference (used when BVN returns bank code)
export const BANK_CODES: Record<string, string> = {
  '044': 'Access Bank',
  '058': 'GTBank',
  '011': 'First Bank',
  '030': 'Heritage Bank',
  '076': 'Polaris Bank',
  '221': 'Stanbic IBTC',
  '032': 'Union Bank',
  '033': 'UBA',
  '035': 'Wema Bank',
  '057': 'Zenith Bank',
};

export function bankName(code: string): string {
  return BANK_CODES[code] ?? `Bank (${code})`;
}
