// apps/api/src/services/identity/rate-limit.service.ts
import { redisClient } from '../../redis/client';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

interface RateLimitResult {
  allowed: boolean;
  attemptsLeft: number;
  resetAt?: Date;
}

/**
 * Check NIN verification rate limit
 * Limits each phone number to MAX_NIN_ATTEMPTS per 24 hours
 */
export async function checkNinRateLimit(phone: string): Promise<RateLimitResult> {
  const key = `nin:attempts:${phone}`;
  const maxAttempts = env.MAX_NIN_ATTEMPTS;

  try {
    // Get current attempt count
    const attemptsStr = await redisClient.get(key);
    const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;

    // Check if limit exceeded
    if (attempts >= maxAttempts) {
      const ttl = await redisClient.ttl(key);
      const resetAt = new Date(Date.now() + ttl * 1000);
      
      logger.warn(
        { phone: '[REDACTED]', attempts, maxAttempts },
        'NIN rate limit exceeded'
      );

      return {
        allowed: false,
        attemptsLeft: 0,
        resetAt,
      };
    }

    // Increment attempt counter
    const newAttempts = await redisClient.incr(key);
    
    // Set expiry on first attempt (24 hours)
    if (newAttempts === 1) {
      await redisClient.expire(key, 86400); // 24 hours in seconds
    }

    logger.debug(
      { phone: '[REDACTED]', attempts: newAttempts, maxAttempts },
      'NIN rate limit check passed'
    );

    return {
      allowed: true,
      attemptsLeft: maxAttempts - newAttempts,
    };
  } catch (error) {
    logger.error({ error, phone: '[REDACTED]' }, 'NIN rate limit check failed');
    
    // Fail open - allow the attempt if Redis is down
    // This prevents Redis outages from blocking legitimate users
    return {
      allowed: true,
      attemptsLeft: maxAttempts - 1,
    };
  }
}

/**
 * Reset NIN rate limit for a phone number (admin action)
 */
export async function resetNinRateLimit(phone: string): Promise<void> {
  const key = `nin:attempts:${phone}`;
  
  try {
    await redisClient.del(key);
    
    logger.info(
      { phone: '[REDACTED]' },
      'NIN rate limit reset by admin'
    );
  } catch (error) {
    logger.error({ error, phone: '[REDACTED]' }, 'Failed to reset NIN rate limit');
    throw error;
  }
}

/**
 * Get current NIN attempt count for a phone number
 */
export async function getNinAttemptCount(phone: string): Promise<{
  attempts: number;
  maxAttempts: number;
  resetAt?: Date;
}> {
  const key = `nin:attempts:${phone}`;
  const maxAttempts = env.MAX_NIN_ATTEMPTS;

  try {
    const attemptsStr = await redisClient.get(key);
    const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;
    
    let resetAt: Date | undefined;
    if (attempts > 0) {
      const ttl = await redisClient.ttl(key);
      if (ttl > 0) {
        resetAt = new Date(Date.now() + ttl * 1000);
      }
    }

    return {
      attempts,
      maxAttempts,
      resetAt,
    };
  } catch (error) {
    logger.error({ error, phone: '[REDACTED]' }, 'Failed to get NIN attempt count');
    return {
      attempts: 0,
      maxAttempts,
    };
  }
}

/**
 * Check if phone has exceeded BVN verification rate limit
 * Same logic as NIN but separate counter
 */
export async function checkBvnRateLimit(phone: string): Promise<RateLimitResult> {
  const key = `bvn:attempts:${phone}`;
  const maxAttempts = env.MAX_NIN_ATTEMPTS; // Use same limit

  try {
    const attemptsStr = await redisClient.get(key);
    const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;

    if (attempts >= maxAttempts) {
      const ttl = await redisClient.ttl(key);
      const resetAt = new Date(Date.now() + ttl * 1000);
      
      logger.warn(
        { phone: '[REDACTED]', attempts, maxAttempts },
        'BVN rate limit exceeded'
      );

      return {
        allowed: false,
        attemptsLeft: 0,
        resetAt,
      };
    }

    const newAttempts = await redisClient.incr(key);
    
    if (newAttempts === 1) {
      await redisClient.expire(key, 86400);
    }

    return {
      allowed: true,
      attemptsLeft: maxAttempts - newAttempts,
    };
  } catch (error) {
    logger.error({ error, phone: '[REDACTED]' }, 'BVN rate limit check failed');
    return {
      allowed: true,
      attemptsLeft: maxAttempts - 1,
    };
  }
}

/**
 * Reset BVN rate limit for a phone number (admin action)
 */
export async function resetBvnRateLimit(phone: string): Promise<void> {
  const key = `bvn:attempts:${phone}`;
  
  try {
    await redisClient.del(key);
    
    logger.info(
      { phone: '[REDACTED]' },
      'BVN rate limit reset by admin'
    );
  } catch (error) {
    logger.error({ error, phone: '[REDACTED]' }, 'Failed to reset BVN rate limit');
    throw error;
  }
}
