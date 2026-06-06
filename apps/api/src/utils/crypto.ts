// apps/api/src/utils/crypto.ts
// All sensitive data handling lives here.
// NIN is NEVER stored raw — only HMAC-SHA256 hash.
// Bank account numbers stored AES-256-GCM encrypted.
import crypto from 'crypto';
import { env } from '../config/env';

// ─── NIN Hashing ─────────────────────────────────────────────────────────────

/** Returns HMAC-SHA256 of the NIN. Original NIN is never persisted. */
export function hashNin(nin: string): string {
  const clean = nin.replace(/\D/g, '');
  return crypto
    .createHmac('sha256', env.NIN_SALT)
    .update(clean)
    .digest('hex');
}

/** Compare an incoming NIN against a stored hash without revealing the NIN. */
export function verifyNinHash(nin: string, storedHash: string): boolean {
  const incoming = hashNin(nin);
  return crypto.timingSafeEqual(Buffer.from(incoming), Buffer.from(storedHash));
}

// ─── AES-256-GCM Encryption ──────────────────────────────────────────────────

const KEY = Buffer.from(env.ENCRYPTION_KEY, 'hex'); // 32 bytes from 64-char hex

/** Encrypts a string. Returns iv:tag:ciphertext as a single colon-delimited string. */
export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
}

/** Decrypts a string produced by encrypt(). Returns null on invalid input. */
export function decrypt(data: string): string | null {
  try {
    const parts = data.split(':');
    if (parts.length !== 3) return null;
    const [ivHex, tagHex, encHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
    decipher.setAuthTag(tag);
    return (
      decipher.update(Buffer.from(encHex, 'hex')).toString('utf8') +
      decipher.final('utf8')
    );
  } catch {
    return null;
  }
}

// ─── General helpers ─────────────────────────────────────────────────────────

/** Generate a secure random token (for deal references, etc.) */
export function secureToken(bytes = 16): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/** Constant-time string comparison to prevent timing attacks */
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
