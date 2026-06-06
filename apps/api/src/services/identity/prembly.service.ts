// apps/api/src/services/identity/prembly.service.ts
import axios, { type AxiosError } from 'axios';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { hashNin } from '../../utils/crypto';
import { namesMatch } from '../../utils/name-match';
import { digitsOnly } from '../../utils/sanitize';
import { prisma } from '../../db/prisma';

const premblyHeaders = {
  'x-api-key': env.PREMBLY_API_KEY,
  'app-id': env.PREMBLY_APP_ID,
  'Content-Type': 'application/json',
};

// ─── Mock Data (dev mode) ────────────────────────────────────────────────────

const MOCK_NIN_DB: Record<string, { fullName: string; dob: string; gender: string }> = {
  '12345678901': { fullName: 'ADEWALE IBRAHIM HASSAN', dob: '1990-05-15', gender: 'Male' },
  '98765432109': { fullName: 'CHIOMA NKECHI OKAFOR',  dob: '1988-11-22', gender: 'Female' },
  '11111111111': { fullName: 'TEST USER ONE',          dob: '1995-01-01', gender: 'Male' },
};

const MOCK_BVN_DB: Record<string, { fullName: string; bankCode: string; accountNumber: string }> = {
  '1234567890': { fullName: 'ADEWALE IBRAHIM HASSAN', bankCode: '044', accountNumber: '0123456789' },
  '9876543210': { fullName: 'CHIOMA OKAFOR NKECHI',   bankCode: '011', accountNumber: '9876543210' },
  '1111111111': { fullName: 'TEST USER ONE',           bankCode: '058', accountNumber: '1111111111' },
};

// ─── NIN Verification ────────────────────────────────────────────────────────

export interface NinResult {
  success: boolean;
  fullName?: string;
  dob?: string;
  gender?: string;
  nimcRef?: string;
  error?: string;
}

export async function verifyNin(nin: string): Promise<NinResult> {
  const clean = digitsOnly(nin);

  if (env.USE_MOCK_NIN) {
    const mock = MOCK_NIN_DB[clean];
    if (!mock) return { success: false, error: 'NIN not found in NIMC database. Please check and retry.' };
    return { success: true, ...mock, nimcRef: `MOCK-NIN-${clean}` };
  }

  try {
    const { data } = await axios.post(
      `${env.PREMBLY_BASE_URL}/identitypass/verification/nin`,
      { number: clean, consent: true },
      { headers: premblyHeaders, timeout: 15_000 }
    );

    if (!data.status) {
      return { success: false, error: 'NIN not found in NIMC database. Please check and retry.' };
    }

    const d = data.data ?? {};
    const fullName = [d.firstname, d.middlename, d.lastname].filter(Boolean).join(' ').toUpperCase();

    return {
      success: true,
      fullName,
      dob: d.birthdate,
      gender: d.gender,
      nimcRef: data.response_code ?? `NIMC-${Date.now()}`,
    };
  } catch (err) {
    const axErr = err as AxiosError;
    logger.error({ err: axErr.message, nin: 'REDACTED' }, 'Prembly NIN verification failed');
    throw new Error('Identity check service is temporarily unavailable. We will retry automatically.');
  }
}

// ─── BVN + NIN Cross-Match Verification ──────────────────────────────────────

export interface BvnResult {
  success: boolean;
  nameMatch: boolean;
  nameScore: number;
  bankCode?: string;
  accountNumber?: string;
  bvnRef?: string;
  error?: string;
}

export async function verifyBvnWithNin(
  bvn: string,
  nin: string,
  nimcName: string
): Promise<BvnResult> {
  const cleanBvn = digitsOnly(bvn);
  const cleanNin = digitsOnly(nin);

  if (env.USE_MOCK_NIN) {
    const mock = MOCK_BVN_DB[cleanBvn];
    if (!mock) return { success: false, nameMatch: false, nameScore: 0, error: 'BVN not found. Please check and retry.' };
    const { match, score } = namesMatch(nimcName, mock.fullName);
    return { success: true, nameMatch: match, nameScore: score, ...mock, bvnRef: `MOCK-BVN-${cleanBvn}` };
  }

  try {
    // Prembly mashup: verifies BVN and NIN together, returns both records
    const { data } = await axios.post(
      `${env.PREMBLY_BASE_URL}/identitypass/verification/bvn-nin-phone`,
      { number: cleanBvn, nin: cleanNin, consent: true },
      { headers: premblyHeaders, timeout: 15_000 }
    );

    if (!data.status) {
      return { success: false, nameMatch: false, nameScore: 0, error: 'BVN verification failed. Please check your BVN and retry.' };
    }

    const bvnData = data.data ?? {};
    const bvnName = [bvnData.firstName, bvnData.lastName].filter(Boolean).join(' ').toUpperCase();

    const { match, score } = namesMatch(nimcName, bvnName);

    return {
      success: true,
      nameMatch: match,
      nameScore: score,
      bankCode: bvnData.enrollmentBank,
      accountNumber: bvnData.accountNumber1,
      bvnRef: data.response_code ?? `BVN-${Date.now()}`,
    };
  } catch (err) {
    const axErr = err as AxiosError;
    logger.error({ err: axErr.message }, 'Prembly BVN verification failed');
    throw new Error('Identity check service is temporarily unavailable. We will retry automatically.');
  }
}

// ─── Rate Limiting ────────────────────────────────────────────────────────────
// Moved to dedicated rate-limit.service.ts for better organization
// Import with: import { checkNinRateLimit, checkBvnRateLimit } from './rate-limit.service';
