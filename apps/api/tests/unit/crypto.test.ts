// apps/api/tests/unit/crypto.test.ts
import { describe, it, expect } from 'vitest';
import { hashNin, verifyNinHash, encrypt, decrypt, secureToken } from '../../src/utils/crypto';

describe('hashNin', () => {
  it('produces a consistent hash for same NIN', () => {
    const hash1 = hashNin('12345678901');
    const hash2 = hashNin('12345678901');
    expect(hash1).toBe(hash2);
  });

  it('strips non-digits before hashing', () => {
    expect(hashNin('123 456 789 01')).toBe(hashNin('12345678901'));
  });

  it('produces different hashes for different NIMs', () => {
    expect(hashNin('12345678901')).not.toBe(hashNin('98765432109'));
  });

  it('returns a 64-char hex string', () => {
    expect(hashNin('12345678901')).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('verifyNinHash', () => {
  it('returns true for matching NIN and hash', () => {
    const hash = hashNin('12345678901');
    expect(verifyNinHash('12345678901', hash)).toBe(true);
  });

  it('returns false for mismatched NIN', () => {
    const hash = hashNin('12345678901');
    expect(verifyNinHash('98765432109', hash)).toBe(false);
  });
});

describe('encrypt / decrypt', () => {
  it('roundtrips correctly', () => {
    const original = '0123456789'; // bank account number
    const encrypted = encrypt(original);
    expect(decrypt(encrypted)).toBe(original);
  });

  it('produces different ciphertext each time (random IV)', () => {
    const a = encrypt('same-value');
    const b = encrypt('same-value');
    expect(a).not.toBe(b);
    // But both decrypt to same value
    expect(decrypt(a)).toBe(decrypt(b));
  });

  it('returns null for tampered ciphertext', () => {
    const encrypted = encrypt('secret');
    const tampered = encrypted.replace(/.$/, 'X');
    expect(decrypt(tampered)).toBeNull();
  });

  it('returns null for malformed input', () => {
    expect(decrypt('not:valid')).toBeNull();
    expect(decrypt('only-one-part')).toBeNull();
  });
});

describe('secureToken', () => {
  it('generates unique tokens', () => {
    const t1 = secureToken();
    const t2 = secureToken();
    expect(t1).not.toBe(t2);
  });

  it('generates hex string of correct length', () => {
    // default 16 bytes = 32 hex chars
    expect(secureToken(16)).toHaveLength(32);
    expect(secureToken(32)).toHaveLength(64);
  });
});
