// apps/api/tests/unit/fee.test.ts
import { describe, it, expect } from 'vitest';
import { calculateFeeKobo, buyerTotalKobo } from '../../src/services/deal/fee.service';

describe('calculateFeeKobo', () => {
  it('applies 1.5% for amounts ≤ ₦50,000', () => {
    const amount = BigInt(5_000_000); // ₦50,000
    const fee = calculateFeeKobo(amount);
    expect(fee).toBe(BigInt(75_000)); // 1.5% of 5,000,000 = 75,000 kobo
  });

  it('applies 1.2% for ₦50,001 – ₦500,000', () => {
    const amount = BigInt(10_000_000); // ₦100,000
    const fee = calculateFeeKobo(amount);
    expect(fee).toBe(BigInt(120_000)); // 1.2%
  });

  it('applies 0.9% for ₦500,001 – ₦2,000,000', () => {
    const amount = BigInt(100_000_000); // ₦1,000,000
    const fee = calculateFeeKobo(amount);
    expect(fee).toBe(BigInt(900_000)); // 0.9%
  });

  it('applies 0.7% for ₦2,000,001 – ₦5,000,000', () => {
    const amount = BigInt(300_000_000); // ₦3,000,000
    const fee = calculateFeeKobo(amount);
    expect(fee).toBe(BigInt(2_100_000)); // 0.7%
  });

  it('applies 0.6% for > ₦5,000,000', () => {
    const amount = BigInt(600_000_000); // ₦6,000,000
    const fee = calculateFeeKobo(amount);
    expect(fee).toBe(BigInt(3_600_000)); // 0.6%
  });
});

describe('buyerTotalKobo', () => {
  it('adds platform fee and Paystack fee to deal amount', () => {
    const amount = BigInt(10_000_000); // ₦100,000
    const result = buyerTotalKobo(amount);

    expect(result.amount).toBe(amount);
    expect(result.platformFee).toBe(BigInt(120_000)); // 1.2%
    expect(result.paystackFee).toBe(BigInt(100_000)); // 1% of 10,000,000 = 100,000
    expect(result.total).toBe(BigInt(10_220_000));
  });

  it('caps Paystack fee at ₦300 (30,000 kobo)', () => {
    const amount = BigInt(500_000_000); // ₦5,000,000
    const result = buyerTotalKobo(amount);
    expect(result.paystackFee).toBe(BigInt(30_000)); // capped at ₦300
  });
});
