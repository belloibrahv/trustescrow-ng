// apps/api/prisma/seed.ts
// Run with: npm run db:seed
// Creates realistic test data for local development.
import { PrismaClient, DealStatus } from '@prisma/client';
import { hashNin, encrypt } from '../src/utils/crypto';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Test Users ─────────────────────────────────────────────────────────────
  const buyer1 = await prisma.user.upsert({
    where: { phone: '+2348012345678' },
    update: {},
    create: {
      phone: '+2348012345678',
      fullName: 'ADEWALE IBRAHIM HASSAN',
      ninHash: hashNin('12345678901'),
      nimcRef: 'MOCK-NIN-12345678901',
      dateOfBirth: '1990-05-15',
      gender: 'Male',
      bvnVerified: true,
      bankCode: '058',
      bankAccountNumberEnc: encrypt('0123456789'),
      paystackCustomerId: 'CUS_test_buyer1',
      consentGiven: true,
      consentTimestamp: new Date(),
    },
  });

  const seller1 = await prisma.user.upsert({
    where: { phone: '+2348098765432' },
    update: {},
    create: {
      phone: '+2348098765432',
      fullName: 'CHIOMA NKECHI OKAFOR',
      ninHash: hashNin('98765432109'),
      nimcRef: 'MOCK-NIN-98765432109',
      dateOfBirth: '1988-11-22',
      gender: 'Female',
      bvnVerified: true,
      bankCode: '011',
      bankAccountNumberEnc: encrypt('9876543210'),
      paystackCustomerId: 'CUS_test_seller1',
      paystackRecipientCode: 'RCP_test_seller1',
      consentGiven: true,
      consentTimestamp: new Date(),
    },
  });

  // ── Test Deals ─────────────────────────────────────────────────────────────

  // Deal 1: FUNDS_HELD (payment received, awaiting delivery confirmation)
  const deal1 = await prisma.deal.upsert({
    where: { dealRef: 'DEAL-2025-TEST01' },
    update: {},
    create: {
      dealRef: 'DEAL-2025-TEST01',
      buyerId: buyer1.id,
      sellerId: seller1.id,
      status: DealStatus.FUNDS_HELD,
      amountKobo: 8_000_000n,  // ₦80,000
      feeKobo: 96_000n,        // 1.2%
      itemDescription: 'iPhone 14 Pro Max 256GB Space Black',
      dvaAccountNumber: '7234567890',
      dvaBankName: 'Wema Bank',
      paystackDvaId: 'DVA_test_001',
      paystackChargeRef: 'CHG_test_001',
      dvaExpiresAt: new Date(Date.now() + 4 * 86_400_000),
    },
  });

  // Deal 2: DISPUTE_OPEN
  const deal2 = await prisma.deal.upsert({
    where: { dealRef: 'DEAL-2025-TEST02' },
    update: {},
    create: {
      dealRef: 'DEAL-2025-TEST02',
      buyerId: buyer1.id,
      sellerId: seller1.id,
      status: DealStatus.DISPUTE_OPEN,
      amountKobo: 25_000_000n, // ₦250,000
      feeKobo: 300_000n,       // 1.2%
      itemDescription: 'Samsung Galaxy S24 Ultra',
      dvaAccountNumber: '7234567891',
      dvaBankName: 'Wema Bank',
      paystackDvaId: 'DVA_test_002',
      paystackChargeRef: 'CHG_test_002',
    },
  });

  // Dispute for deal 2
  await prisma.dispute.upsert({
    where: { dealId: deal2.id },
    update: {},
    create: {
      dealId: deal2.id,
      openedById: buyer1.id,
      reason: 'Item received was damaged — screen cracked, different model than advertised.',
      buyerEvidence: 'I received the phone in a damaged box. Serial number does not match.',
      status: 'OPEN',
    },
  });

  // Deal 3: COMPLETED
  const deal3 = await prisma.deal.upsert({
    where: { dealRef: 'DEAL-2025-TEST03' },
    update: {},
    create: {
      dealRef: 'DEAL-2025-TEST03',
      buyerId: buyer1.id,
      sellerId: seller1.id,
      status: DealStatus.COMPLETED,
      amountKobo: 5_000_000n, // ₦50,000
      feeKobo: 75_000n,       // 1.5%
      itemDescription: 'Nike Air Max 90 Size 42',
      paystackChargeRef: 'CHG_test_003',
      paystackTransferId: 'TRF_test_003',
      resolvedAt: new Date(Date.now() - 86_400_000),
    },
  });

  // ── Sample Messages for Deal 1 ─────────────────────────────────────────────
  const messages = [
    { userId: buyer1.id, direction: 'INBOUND' as const, body: 'START', intent: 'START_DEAL' },
    { userId: buyer1.id, direction: 'OUTBOUND' as const, body: 'Welcome to TrustEscrow NG. Enter seller\'s phone to begin.', intent: null },
    { userId: buyer1.id, direction: 'INBOUND' as const, body: '08098765432', intent: 'SUBMIT_SELLER_PHONE' },
    { userId: buyer1.id, direction: 'OUTBOUND' as const, body: 'TrustEscrow collects your NIN & BVN per NDPR. Reply YES to consent.', intent: null },
    { userId: buyer1.id, direction: 'INBOUND' as const, body: 'YES', intent: 'CONSENT_YES' },
    { userId: buyer1.id, direction: 'OUTBOUND' as const, body: 'Please enter your 11-digit NIN.', intent: null },
    { userId: buyer1.id, direction: 'INBOUND' as const, body: '12345678901', intent: 'SUBMIT_NIN' },
    { userId: buyer1.id, direction: 'OUTBOUND' as const, body: 'Identity confirmed: ADEWALE IBRAHIM HASSAN. Enter your BVN.', intent: null },
    { userId: buyer1.id, direction: 'INBOUND' as const, body: '1234567890', intent: 'SUBMIT_BVN' },
    { userId: buyer1.id, direction: 'OUTBOUND' as const, body: 'Bank identity verified. Describe the deal (item + price).', intent: null },
    { userId: buyer1.id, direction: 'INBOUND' as const, body: 'iPhone 14 Pro Max 256GB, 80000 naira', intent: 'SUBMIT_TERMS' },
    { userId: buyer1.id, direction: 'OUTBOUND' as const, body: 'Pay ₦82,096 to: Wema Bank 7234567890. Ref: DEAL-2025-TEST01', intent: null },
  ];

  for (const msg of messages) {
    await prisma.message.create({ data: { ...msg, dealId: deal1.id } });
  }

  // ── Audit Logs ─────────────────────────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      { dealId: deal1.id, action: 'DEAL_CREATED', payload: { buyerPhone: '+2348012345678', sellerPhone: '+2348098765432' }, actorType: 'user', actorId: buyer1.id },
      { dealId: deal1.id, action: 'NIN_VERIFIED', payload: { role: 'buyer' }, actorType: 'user', actorId: buyer1.id },
      { dealId: deal1.id, action: 'FUNDS_HELD', payload: { reference: 'CHG_test_001', amountKobo: 8_000_000 }, actorType: 'paystack_webhook' },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Seed complete!');
  console.log(`   Buyer: ${buyer1.phone} (ADEWALE IBRAHIM)`);
  console.log(`   Seller: ${seller1.phone} (CHIOMA OKAFOR)`);
  console.log(`   Deal FUNDS_HELD: ${deal1.dealRef}`);
  console.log(`   Deal DISPUTE_OPEN: ${deal2.dealRef}`);
  console.log(`   Deal COMPLETED: ${deal3.dealRef}`);
  console.log('\n   Test NINs: 12345678901, 98765432109');
  console.log('   Test BVNs: 1234567890, 9876543210');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
