// apps/api/tests/integration/identity.test.ts
import { describe, it, expect, vi } from 'vitest';
import { verifyNin, verifyBvnWithNin } from '../../src/services/identity/prembly.service';
import { checkNinRateLimit } from '../../src/services/identity/rate-limit.service';

// Mock Redis for rate limiting
vi.mock('../../src/redis/client', () => ({
  redisClient: {
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
  },
}));

// USE_MOCK_NIN=true is set in setup.ts — all tests use mock DB

describe('verifyNin (mock mode)', () => {
  it('returns success for known test NIN', async () => {
    const result = await verifyNin('12345678901');
    expect(result.success).toBe(true);
    expect(result.fullName).toBe('ADEWALE IBRAHIM HASSAN');
    expect(result.dob).toBe('1990-05-15');
    expect(result.nimcRef).toContain('MOCK-NIN');
  });

  it('returns failure for unknown NIN', async () => {
    const result = await verifyNin('00000000000');
    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('strips spaces before matching', async () => {
    const result = await verifyNin('123 456 789 01');
    expect(result.success).toBe(true);
  });
});

describe('verifyBvnWithNin (mock mode)', () => {
  it('returns success and name match for known BVN+NIN combination', async () => {
    const result = await verifyBvnWithNin('1234567890', '12345678901', 'ADEWALE IBRAHIM HASSAN');
    expect(result.success).toBe(true);
    expect(result.nameMatch).toBe(true);
    expect(result.nameScore).toBeGreaterThan(0.80);
  });

  it('returns name mismatch when names differ significantly', async () => {
    const result = await verifyBvnWithNin('9876543210', '98765432109', 'JOHN SMITH FOREIGN');
    expect(result.success).toBe(true);
    expect(result.nameMatch).toBe(false);
  });

  it('returns failure for unknown BVN', async () => {
    const result = await verifyBvnWithNin('0000000000', '12345678901', 'ADEWALE IBRAHIM');
    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });
});

describe('checkNinRateLimit', () => {
  it('allows first attempt', async () => {
    const { allowed, attemptsLeft } = await checkNinRateLimit('+2348012345678');
    expect(allowed).toBe(true);
    expect(attemptsLeft).toBe(2); // MAX=3, used=1
  });

  it('blocks after max attempts', async () => {
    const { redisClient } = await import('../../src/redis/client');
    (redisClient.incr as any).mockResolvedValueOnce(4); // 4th attempt > max 3

    const { allowed, attemptsLeft } = await checkNinRateLimit('+2348099999999');
    expect(allowed).toBe(false);
    expect(attemptsLeft).toBe(0);
  });
});
