// apps/api/src/utils/sanitize.ts
// All user-supplied input passes through these helpers before processing.

/** Strip everything except digits. Used for NIN and BVN cleaning. */
export function digitsOnly(input: string): string {
  return input.replace(/\D/g, '');
}

/** Validate NIN: 11 digits exactly */
export function isValidNin(nin: string): { valid: boolean; error?: string } {
  const clean = digitsOnly(nin);
  if (clean.length === 10) {
    return { valid: false, error: "That looks like a BVN (10 digits). Your NIN is 11 digits. Please re-enter." };
  }
  if (clean.length !== 11) {
    return { valid: false, error: `NIN must be 11 digits. You entered ${clean.length}. Please check and resend.` };
  }
  return { valid: true };
}

/** Validate BVN: 10 digits exactly */
export function isValidBvn(bvn: string): { valid: boolean; error?: string } {
  const clean = digitsOnly(bvn);
  if (clean.length === 11) {
    return { valid: false, error: "That looks like a NIN (11 digits). Your BVN is 10 digits. Please re-enter." };
  }
  if (clean.length !== 10) {
    return { valid: false, error: `BVN must be 10 digits. You entered ${clean.length}. Please check and resend.` };
  }
  return { valid: true };
}

/** Normalise Nigerian phone numbers to +234XXXXXXXXXX format */
export function normalisePhone(phone: string): string {
  const clean = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
  if (clean.startsWith('+234')) return clean;
  if (clean.startsWith('234')) return `+${clean}`;
  if (clean.startsWith('0') && clean.length === 11) return `+234${clean.substring(1)}`;
  if (clean.length === 10) return `+234${clean}`;
  return clean; // Return as-is if we can't normalise; validation catches later
}

/** Validate a Nigerian phone number */
export function isValidPhone(phone: string): boolean {
  const normalised = normalisePhone(phone);
  return /^\+234\d{10}$/.test(normalised);
}

/** Truncate an SMS to 160 characters — always enforced before sending */
export function truncateSms(text: string): string {
  return text.substring(0, 160);
}

/** Convert amount string (e.g. "80,000" or "80000" or "N80,000") to kobo */
export function parseAmountToKobo(input: string): number | null {
  // Strip currency symbols, commas, spaces
  const clean = input.replace(/[₦NGNnaira,\s]/gi, '').trim();
  const num = parseFloat(clean);
  if (isNaN(num) || num <= 0) return null;
  return Math.round(num * 100); // NGN to kobo
}

/** Format kobo amount to NGN string for SMS display */
export function formatNgn(kobo: bigint | number): string {
  const naira = Number(kobo) / 100;
  return `₦${naira.toLocaleString('en-NG')}`;
}
