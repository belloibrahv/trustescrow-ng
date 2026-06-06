// apps/api/tests/unit/sanitize.test.ts
import { describe, it, expect } from 'vitest';
import {
  digitsOnly, isValidNin, isValidBvn,
  normalisePhone, isValidPhone,
  parseAmountToKobo, formatNgn, truncateSms,
} from '../../src/utils/sanitize';

describe('digitsOnly', () => {
  it('strips non-digit characters', () => {
    expect(digitsOnly('123 456 789 01')).toBe('12345678901');
    expect(digitsOnly('NIN: 123-456')).toBe('123456');
  });
});

describe('isValidNin', () => {
  it('accepts 11-digit NIN', () => {
    expect(isValidNin('12345678901').valid).toBe(true);
  });

  it('rejects 10-digit (suggests BVN)', () => {
    const r = isValidNin('1234567890');
    expect(r.valid).toBe(false);
    expect(r.error).toContain('BVN');
  });

  it('rejects wrong length with count', () => {
    const r = isValidNin('123456');
    expect(r.valid).toBe(false);
    expect(r.error).toContain('6');
  });
});

describe('isValidBvn', () => {
  it('accepts 10-digit BVN', () => {
    expect(isValidBvn('1234567890').valid).toBe(true);
  });

  it('rejects 11-digit (suggests NIN)', () => {
    const r = isValidBvn('12345678901');
    expect(r.valid).toBe(false);
    expect(r.error).toContain('NIN');
  });
});

describe('normalisePhone', () => {
  it('normalises 0 prefix to +234', () => {
    expect(normalisePhone('08012345678')).toBe('+2348012345678');
  });

  it('normalises 234 prefix to +234', () => {
    expect(normalisePhone('2348012345678')).toBe('+2348012345678');
  });

  it('keeps +234 format unchanged', () => {
    expect(normalisePhone('+2348012345678')).toBe('+2348012345678');
  });
});

describe('isValidPhone', () => {
  it('validates correct Nigerian number', () => {
    expect(isValidPhone('08012345678')).toBe(true);
    expect(isValidPhone('+2348012345678')).toBe(true);
  });

  it('rejects non-Nigerian or malformed numbers', () => {
    expect(isValidPhone('123')).toBe(false);
    expect(isValidPhone('+447911123456')).toBe(false);
  });
});

describe('parseAmountToKobo', () => {
  it('converts NGN string to kobo', () => {
    expect(parseAmountToKobo('80000')).toBe(8_000_000);
    expect(parseAmountToKobo('80,000')).toBe(8_000_000);
    expect(parseAmountToKobo('₦80,000')).toBe(8_000_000);
    expect(parseAmountToKobo('N80,000')).toBe(8_000_000);
  });

  it('returns null for invalid input', () => {
    expect(parseAmountToKobo('abc')).toBeNull();
    expect(parseAmountToKobo('-500')).toBeNull();
    expect(parseAmountToKobo('0')).toBeNull();
  });
});

describe('formatNgn', () => {
  it('formats kobo to NGN display string', () => {
    expect(formatNgn(8_000_000n)).toBe('₦80,000');
    expect(formatNgn(100n)).toBe('₦1');
  });
});

describe('truncateSms', () => {
  it('truncates messages over 160 chars', () => {
    const long = 'a'.repeat(200);
    expect(truncateSms(long)).toHaveLength(160);
  });

  it('leaves short messages intact', () => {
    expect(truncateSms('Hello!')).toBe('Hello!');
  });
});
