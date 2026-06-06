// apps/api/src/db/prisma.ts
// Singleton Prisma client — reused across all imports.
// In dev, hot-reload creates multiple instances; globalThis prevents that.
import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Audit log helper — use this everywhere a deal action happens
export async function writeAudit(params: {
  dealId?: string;
  action: string;
  payload: Record<string, unknown>;
  actorType: 'user' | 'system' | 'admin' | 'paystack_webhook';
  actorId?: string;
  ipAddress?: string;
}) {
  return prisma.auditLog.create({ data: params });
}
