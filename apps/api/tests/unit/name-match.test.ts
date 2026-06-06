// apps/api/tests/unit/name-match.test.ts
import { describe, it, expect } from 'vitest';
import { nameSimilarity, namesMatch } from '../../src/utils/name-match';

describe('nameSimilarity', () => {
  it('returns 1.0 for identical names', () => {
    expect(nameSimilarity('ADEWALE IBRAHIM', 'ADEWALE IBRAHIM')).toBe(1);
  });

  it('handles reordered name tokens (NIN vs BVN common case)', () => {
    const score = nameSimilarity('IBRAHIM ADEWALE HASSAN', 'ADEWALE IBRAHIM HASSAN');
    expect(score).toBeGreaterThan(0.80);
  });

  it('handles minor spelling variation', () => {
    const score = nameSimilarity('CHIOMA OKAFOR', 'CHIOMA OKAFOR-NKECHI');
    expect(score).toBeGreaterThan(0.75);
  });

  it('returns low score for completely different names', () => {
    const score = nameSimilarity('JOHN SMITH', 'IBRAHIM HASSAN');
    expect(score).toBeLessThan(0.60);
  });

  it('handles empty strings gracefully', () => {
    expect(nameSimilarity('', 'ADEWALE')).toBe(0);
    expect(nameSimilarity('ADEWALE', '')).toBe(0);
  });
});

describe('namesMatch', () => {
  it('returns match=true for same name in different order', () => {
    const { match, score } = namesMatch('ADEWALE IBRAHIM HASSAN', 'HASSAN ADEWALE IBRAHIM');
    expect(match).toBe(true);
    expect(score).toBeGreaterThan(0.80);
  });

  it('returns match=false for different people', () => {
    const { match } = namesMatch('ADEWALE IBRAHIM', 'CHIOMA OKAFOR');
    expect(match).toBe(false);
  });
});
