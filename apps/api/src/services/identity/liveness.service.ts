// apps/api/src/services/identity/liveness.service.ts
import { env } from '../../config/env';
import { prisma } from '../../db/prisma';
import { sendSms } from '../sms/sms.service';
import { logger } from '../../utils/logger';
import type { Deal, User } from '@prisma/client';

interface LivenessCheckResult {
  success: boolean;
  score?: number;
  error?: string;
  verificationId?: string;
}

/**
 * Trigger liveness check for high-value deals (>= LIVENESS_THRESHOLD_KOBO)
 * Tier 3 verification: Face match against NIMC database
 */
export async function triggerLivenessCheck(
  deal: Deal & { buyer: User; seller?: User | null },
  userType: 'buyer' | 'seller'
): Promise<{ required: boolean; triggered?: boolean }> {
  const amountNgn = Number(deal.amountKobo) / 100;
  const thresholdNgn = env.LIVENESS_THRESHOLD_KOBO / 100;

  // Check if liveness is required
  if (Number(deal.amountKobo) < env.LIVENESS_THRESHOLD_KOBO) {
    logger.debug(
      { dealId: deal.id, amount: amountNgn, threshold: thresholdNgn },
      'Liveness check not required for this deal amount'
    );
    return { required: false };
  }

  const user = userType === 'buyer' ? deal.buyer : deal.seller;
  if (!user) {
    return { required: true, triggered: false };
  }

  // Check if user already has valid liveness check
  if (user.faceMatchScore && user.faceMatchScore >= 0.85) {
    logger.info(
      { userId: user.id, score: user.faceMatchScore },
      'User already has valid liveness check'
    );
    return { required: true, triggered: false };
  }

  // Send SMS with liveness check link
  const livenessUrl = `${env.APP_URL}/verify/liveness/${user.id}`;
  
  await sendSms({
    to: user.phone,
    message: `⚠️ High-value deal (₦${amountNgn.toLocaleString()}). For security, please complete face verification: ${livenessUrl}\n\nRef: ${deal.dealRef}`,
  });

  logger.info(
    { userId: user.id, dealId: deal.id, amount: amountNgn },
    'Liveness check triggered'
  );

  return { required: true, triggered: true };
}

/**
 * Perform liveness check using Prembly or Smile Identity
 * This is a POST-MVP implementation placeholder
 */
export async function performLivenessCheck(
  userId: string,
  selfieBase64: string
): Promise<LivenessCheckResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { success: false, error: 'User not found' };
  }

  // POST-MVP: Integrate with Prembly Liveness API or Smile Identity
  // For now, we'll return a mock result in development
  if (env.NODE_ENV === 'development' || env.USE_MOCK_NIN) {
    logger.warn('Using mock liveness check - NOT FOR PRODUCTION');
    
    const mockScore = 0.92; // Simulated match score
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        faceMatchScore: mockScore,
        faceMatchTimestamp: new Date(),
      },
    });

    return {
      success: true,
      score: mockScore,
      verificationId: 'MOCK_LIVENESS_' + Date.now(),
    };
  }

  // PRODUCTION: Call Prembly Liveness API
  try {
    const response = await fetch(`${env.PREMBLY_BASE_URL}/api/v1/biometrics/merchant/data/verification/liveness`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.PREMBLY_API_KEY,
        'app-id': env.PREMBLY_APP_ID,
      },
      body: JSON.stringify({
        image: selfieBase64,
        number: user.ninHash, // NIN for photo comparison
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      logger.error({ result, userId }, 'Prembly liveness check failed');
      return {
        success: false,
        error: result.message || 'Liveness check failed',
      };
    }

    const score = result.data?.confidence || 0;
    const passed = score >= 0.85; // 85% threshold

    await prisma.user.update({
      where: { id: userId },
      data: {
        faceMatchScore: score,
        faceMatchTimestamp: new Date(),
      },
    });

    logger.info(
      { userId, score, passed },
      'Liveness check completed'
    );

    return {
      success: passed,
      score,
      verificationId: result.data?.verification_id,
    };
  } catch (error) {
    logger.error({ error, userId }, 'Liveness check error');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if user's liveness verification is still valid (not expired)
 */
export function isLivenessValid(user: User): boolean {
  if (!user.faceMatchScore || !user.faceMatchTimestamp) {
    return false;
  }

  // Liveness checks are valid for 90 days
  const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;
  const expiryDate = new Date(user.faceMatchTimestamp.getTime() + NINETY_DAYS);
  
  return user.faceMatchScore >= 0.85 && new Date() < expiryDate;
}
