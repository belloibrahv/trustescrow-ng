// apps/api/src/services/deal/fee.service.ts
// Platform fee schedule. All amounts in KOBO.
// Paystack also charges 1% (max ₦300) on the DVA transfer — this is passed to buyer.

/** 
 * Calculate platform fee in kobo based on deal amount.
 * Sliding scale encourages larger deals.
 */
export function calculateFeeKobo(amountKobo: bigint): bigint {
  const amount = Number(amountKobo);

  let feePercent: number;

  if (amount <= 5_000_000) {          // ≤ ₦50,000
    feePercent = 0.015;               // 1.5%
  } else if (amount <= 50_000_000) {  // ₦50,001 – ₦500,000
    feePercent = 0.012;               // 1.2%
  } else if (amount <= 200_000_000) { // ₦500,001 – ₦2,000,000
    feePercent = 0.009;               // 0.9%
  } else if (amount <= 500_000_000) { // ₦2,000,001 – ₦5,000,000
    feePercent = 0.007;               // 0.7%
  } else {                            // > ₦5,000,000
    feePercent = 0.006;               // 0.6%
  }

  return BigInt(Math.round(amount * feePercent));
}

/**
 * Total amount buyer pays = deal amount + platform fee + Paystack 1% (max ₦300)
 */
export function buyerTotalKobo(amountKobo: bigint): {
  amount: bigint;
  platformFee: bigint;
  paystackFee: bigint;
  total: bigint;
} {
  const platformFee = calculateFeeKobo(amountKobo);
  // Paystack DVA fee: 1% capped at ₦300 (30,000 kobo)
  const paystackFee = BigInt(Math.min(Math.round(Number(amountKobo) * 0.01), 30_000));
  const total = amountKobo + platformFee + paystackFee;
  return { amount: amountKobo, platformFee, paystackFee, total };
}
