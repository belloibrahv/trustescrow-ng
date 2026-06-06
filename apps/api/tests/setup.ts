// apps/api/tests/setup.ts
import { beforeAll, afterAll, afterEach, vi } from 'vitest';

// ─── Mock environment before any imports ─────────────────────────────────────
// This ensures config/env.ts parses successfully in test context
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.APP_URL = 'http://localhost:3001';
process.env.LOG_LEVEL = 'error';
process.env.ADMIN_JWT_SECRET = 'test-secret-that-is-long-enough-32chars!!';
process.env.ENCRYPTION_KEY = 'a'.repeat(64); // 64-char hex string
process.env.NIN_SALT = 'test-nin-salt-for-unit-tests';
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://test:test@localhost:5432/trustescrow_test';
process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
process.env.AT_USERNAME = 'sandbox';
process.env.AT_API_KEY = 'atsk_test_key';
process.env.AT_SHORTCODE = '15629';
process.env.PAYSTACK_SECRET_KEY = 'sk_test_mock_key';
process.env.PAYSTACK_PUBLIC_KEY = 'pk_test_mock_key';
process.env.PAYSTACK_WEBHOOK_SECRET = 'sk_test_mock_key';
process.env.PAYSTACK_DVA_PROVIDER = 'wema-bank';
process.env.PREMBLY_API_KEY = 'sandbox_mock_key';
process.env.PREMBLY_APP_ID = 'sandbox_mock_app';
process.env.PREMBLY_BASE_URL = 'https://sandbox.prembly.com';
process.env.ANTHROPIC_API_KEY = 'sk-ant-api03-mock-key';
process.env.CLAUDE_MODEL = 'claude-sonnet-4-6';
process.env.CLAUDE_MAX_TOKENS = '1024';
process.env.USE_MOCK_NIN = 'true';
process.env.USE_MOCK_PAYSTACK = 'true';
process.env.LIVENESS_THRESHOLD_KOBO = '50000000';
process.env.DVA_EXPIRY_DAYS = '7';
process.env.DISPUTE_AUTO_ESCALATE_HOURS = '48';
process.env.MAX_NIN_ATTEMPTS = '3';
process.env.DEAL_VALUE_CAP_KOBO = '0';

// ─── Global mock: silence external HTTP in tests ─────────────────────────────
vi.mock('../src/services/sms/sms.service', () => ({
  sendSms: vi.fn().mockResolvedValue(undefined),
  sendSmsToBoth: vi.fn().mockResolvedValue(undefined),
  SMS: {
    welcome: () => 'Welcome',
    consentRequest: () => 'Consent?',
    askNin: () => 'Enter NIN',
    ninConfirmed: (name: string) => `Confirmed: ${name}`,
    ninFailed: (e: string) => e,
    bvnConfirmed: () => 'BVN confirmed',
    bvnFailed: (e: string) => e,
    notifySellerOfDeal: () => 'Notify seller',
    termsLocked: () => 'Terms locked',
    paymentInstructions: () => 'Pay here',
    fundsReceived: () => 'Funds received',
    sellerFundsReleased: () => 'Funds released',
    buyerDealComplete: () => 'Deal complete',
    disputeOpened: () => 'Dispute opened',
    disputeEscalated: () => 'Escalated',
    dvaExpiringSoon: () => 'Expiring',
    dealExpired: () => 'Expired',
    statusReport: () => 'Status',
    genericError: () => 'Error',
    verificationDelayed: () => 'Delayed',
  },
}));

beforeAll(async () => {
  // Any global test DB setup would go here
});

afterEach(() => {
  vi.clearAllMocks();
});

afterAll(async () => {
  // Cleanup
});
