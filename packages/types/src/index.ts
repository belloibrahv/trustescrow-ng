// packages/types/src/index.ts
// Shared types used across API and admin dashboard.

export type DealStatus =
  | 'INITIATED'
  | 'BUYER_VERIFIED'
  | 'BOTH_VERIFIED'
  | 'TERMS_AGREED'
  | 'PAYMENT_PENDING'
  | 'FUNDS_HELD'
  | 'AWAITING_CONFIRMATION'
  | 'COMPLETED'
  | 'REFUNDED'
  | 'DISPUTE_OPEN'
  | 'MEDIATION'
  | 'ESCALATED';

export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'ESCALATED';

export interface DealSummary {
  id: string;
  dealRef: string;
  status: DealStatus;
  amountKobo: number;
  feeKobo: number;
  itemDescription: string;
  buyerPhone: string;
  sellerPhone: string;
  createdAt: string;
  resolvedAt: string | null;
  hasDispute: boolean;
}

export interface UserSummary {
  id: string;
  phone: string;
  fullName: string | null;
  bvnVerified: boolean;
  ninVerified: boolean; // derived: !!ninHash
  consentGiven: boolean;
  dealCount: number;
  createdAt: string;
}

export interface DisputeSummary {
  id: string;
  dealId: string;
  dealRef: string;
  status: DisputeStatus;
  openedByPhone: string;
  reason: string | null;
  createdAt: string;
  resolvedAt: string | null;
  resolvedFor: 'buyer' | 'seller' | null;
}

export interface AdminMetrics {
  totalDeals: number;
  activeDeals: number;
  completedDeals: number;
  disputedDeals: number;
  totalUsers: number;
}

// API response wrappers
export interface ApiSuccess<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  details?: unknown;
}
