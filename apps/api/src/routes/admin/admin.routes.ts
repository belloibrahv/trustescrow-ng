// apps/api/src/routes/admin/admin.routes.ts
import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../db/prisma';
import { DealStatus, DisputeStatus } from '@prisma/client';
import { transferToRecipient, initiateRefund } from '../../services/payment/paystack.service';
import { sendSms } from '../../services/sms/sms.service';
import { formatNgn } from '../../utils/sanitize';
import { logger } from '../../utils/logger';
import { verifyAdminToken } from '../../services/auth/admin-auth.service';
import { resetNinRateLimit, resetBvnRateLimit, getNinAttemptCount } from '../../services/identity/rate-limit.service';

// ─── JWT Auth Middleware ──────────────────────────────────────────────────────

async function requireAdmin(request: any, reply: any) {
  const auth = request.headers.authorization as string | undefined;
  if (!auth?.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'Unauthorized - No token provided' });
  }

  const token = auth.slice(7);
  const admin = verifyAdminToken(token);
  
  if (!admin) {
    return reply.code(401).send({ error: 'Unauthorized - Invalid or expired token' });
  }
  
  request.admin = admin;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export const adminRoutes: FastifyPluginAsync = async (app) => {

  // GET /api/admin/deals — paginated deal list
  app.get('/deals', { preHandler: requireAdmin }, async (request) => {
    const query = request.query as { page?: string; status?: string; limit?: string };
    const page = parseInt(query.page ?? '1');
    const limit = Math.min(parseInt(query.limit ?? '20'), 100);
    const skip = (page - 1) * limit;
    const where = query.status ? { status: query.status as DealStatus } : {};

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        include: {
          buyer: { select: { phone: true, fullName: true, bvnVerified: true } },
          seller: { select: { phone: true, fullName: true, bvnVerified: true } },
          dispute: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.deal.count({ where }),
    ]);

    return { deals, total, page, pages: Math.ceil(total / limit) };
  });

  // GET /api/admin/deals/:id — single deal with full audit log
  app.get('/deals/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        buyer: true, seller: true,
        messages: { orderBy: { createdAt: 'asc' } },
        dispute: true,
        auditLogs: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!deal) return reply.code(404).send({ error: 'Deal not found' });
    return deal;
  });

  // POST /api/admin/disputes/:id/resolve — human mediator resolution
  app.post('/disputes/:id/resolve', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = z.object({
      decision: z.enum(['buyer', 'seller']),
      resolution: z.string().min(10),
    }).parse(request.body);

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: { deal: { include: { buyer: true, seller: true } } },
    });
    if (!dispute) return reply.code(404).send({ error: 'Dispute not found' });

    const deal = dispute.deal;

    if (body.decision === 'seller') {
      // Release to seller
      if (deal.seller?.paystackCustomerId) {
        await transferToRecipient({
          recipientCode: deal.seller.paystackCustomerId,
          amountKobo: deal.amountKobo,
          dealId: deal.id,
          reason: `TrustEscrow dispute resolution ${deal.dealRef}`,
        });
      }
      await prisma.deal.update({ where: { id: deal.id }, data: { status: DealStatus.COMPLETED, resolvedAt: new Date() } });
      await sendSms({ to: deal.seller!.phone, message: `Dispute resolved. ${formatNgn(deal.amountKobo)} released to you. Ref: ${deal.dealRef}` });
      await sendSms({ to: deal.buyer.phone, message: `Dispute resolved in seller's favour for deal ${deal.dealRef}. No refund will be issued.` });
    } else {
      // Refund buyer
      if (deal.paystackChargeRef) {
        await initiateRefund({ chargeReference: deal.paystackChargeRef });
      }
      await prisma.deal.update({ where: { id: deal.id }, data: { status: DealStatus.REFUNDED, resolvedAt: new Date() } });
      await sendSms({ to: deal.buyer.phone, message: `Dispute resolved. Refund for ${formatNgn(deal.amountKobo)} initiated to your bank. Allow 3-7 business days.` });
      await sendSms({ to: deal.seller!.phone, message: `Dispute resolved in buyer's favour for deal ${deal.dealRef}.` });
    }

    await prisma.dispute.update({
      where: { id },
      data: {
        status: DisputeStatus.RESOLVED,
        resolution: body.resolution,
        resolvedFor: body.decision,
        resolvedAt: new Date(),
      },
    });

    return { success: true };
  });

  // GET /api/admin/users/:phone — user KYC lookup
  app.get('/users/:phone', { preHandler: requireAdmin }, async (request, reply) => {
    const { phone } = request.params as { phone: string };
    const user = await prisma.user.findUnique({
      where: { phone },
      include: {
        buyerDeals: { orderBy: { createdAt: 'desc' }, take: 10 },
        sellerDeals: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!user) return reply.code(404).send({ error: 'User not found' });
    // Redact sensitive fields
    const { bankAccountNumberEnc: _, ninHash: __, ...safeUser } = user;
    return safeUser;
  });

  // GET /api/admin/metrics — dashboard stats
  app.get('/metrics', { preHandler: requireAdmin }, async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalDeals,
      activeDeals,
      completedDeals,
      openDisputes,
      totalUsers,
      todayDeals,
      completedDealsData,
    ] = await Promise.all([
      prisma.deal.count(),
      prisma.deal.count({ where: { status: { notIn: [DealStatus.COMPLETED, DealStatus.REFUNDED] } } }),
      prisma.deal.count({ where: { status: DealStatus.COMPLETED } }),
      prisma.deal.count({ where: { status: { in: [DealStatus.DISPUTE_OPEN, DealStatus.MEDIATION, DealStatus.ESCALATED] } } }),
      prisma.user.count(),
      prisma.deal.count({ where: { createdAt: { gte: today } } }),
      prisma.deal.findMany({
        where: { status: DealStatus.COMPLETED },
        select: { feeKobo: true },
      }),
    ]);

    // Calculate total revenue (sum of all fees from completed deals)
    const totalRevenue = completedDealsData.reduce(
      (sum: number, deal: any) => sum + Number(deal.feeKobo),
      0
    );

    return {
      totalDeals,
      activeDeals,
      completedDeals,
      openDisputes,
      totalUsers,
      todayDeals,
      totalRevenue, // in kobo
    };
  });

  // GET /api/admin/analytics/weekly — weekly deal volume and revenue
  app.get('/analytics/weekly', { preHandler: requireAdmin }, async () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const deals = await prisma.deal.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        createdAt: true,
        status: true,
        amountKobo: true,
        feeKobo: true,
      },
    });

    // Group by day
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);
      return {
        name: dayNames[date.getDay()],
        date: date.toISOString().split('T')[0],
        totalDeals: 0,
        completedDeals: 0,
        activeDeals: 0,
        disputedDeals: 0,
        totalValue: 0,
        totalFees: 0,
      };
    });

    deals.forEach((deal: any) => {
      const dealDate = new Date(deal.createdAt);
      dealDate.setHours(0, 0, 0, 0);
      const dayIndex = weeklyData.findIndex((d) => d.date === dealDate.toISOString().split('T')[0]);
      
      if (dayIndex !== -1) {
        weeklyData[dayIndex].totalDeals++;
        weeklyData[dayIndex].totalValue += Number(deal.amountKobo);
        weeklyData[dayIndex].totalFees += Number(deal.feeKobo);
        
        if (deal.status === 'COMPLETED') {
          weeklyData[dayIndex].completedDeals++;
        } else if (['DISPUTE_OPEN', 'MEDIATION', 'ESCALATED'].includes(deal.status)) {
          weeklyData[dayIndex].disputedDeals++;
        } else {
          weeklyData[dayIndex].activeDeals++;
        }
      }
    });

    return weeklyData;
  });

  // GET /api/admin/analytics/status-distribution — deal status breakdown
  app.get('/analytics/status-distribution', { preHandler: requireAdmin }, async () => {
    const statusCounts = await prisma.deal.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    return statusCounts.map((item: any) => ({
      status: item.status,
      count: item._count.status,
    }));
  });

  // GET /api/admin/analytics/recent-activity — recent deals for activity feed
  app.get('/analytics/recent-activity', { preHandler: requireAdmin }, async () => {
    const recentDeals = await prisma.deal.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: { select: { phone: true, fullName: true } },
        seller: { select: { phone: true, fullName: true } },
      },
    });

    return recentDeals.map((deal: any) => ({
      id: deal.id,
      dealRef: deal.dealRef,
      status: deal.status,
      amountKobo: deal.amountKobo.toString(),
      feeKobo: deal.feeKobo.toString(),
      itemDescription: deal.itemDescription,
      buyer: deal.buyer.fullName || deal.buyer.phone,
      seller: deal.seller?.fullName || deal.seller?.phone || 'N/A',
      createdAt: deal.createdAt,
    }));
  });

  // GET /api/admin/rate-limit/:phone — Check NIN/BVN rate limit status
  app.get('/rate-limit/:phone', { preHandler: requireAdmin }, async (request, reply) => {
    const { phone } = request.params as { phone: string };
    
    try {
      const ninStatus = await getNinAttemptCount(phone);
      
      return {
        phone,
        nin: ninStatus,
      };
    } catch (error) {
      logger.error({ error, phone }, 'Failed to get rate limit status');
      return reply.code(500).send({ error: 'Failed to get rate limit status' });
    }
  });

  // POST /api/admin/rate-limit/:phone/reset — Reset rate limits (admin action)
  app.post('/rate-limit/:phone/reset', { preHandler: requireAdmin }, async (request, reply) => {
    const { phone } = request.params as { phone: string };
    const body = z.object({
      type: z.enum(['nin', 'bvn', 'both']),
    }).parse(request.body);

    try {
      if (body.type === 'nin' || body.type === 'both') {
        await resetNinRateLimit(phone);
      }
      if (body.type === 'bvn' || body.type === 'both') {
        await resetBvnRateLimit(phone);
      }

      logger.info(
        { phone, type: body.type, admin: (request as any).admin?.username },
        'Rate limit reset by admin'
      );

      return {
        success: true,
        message: `${body.type.toUpperCase()} rate limit reset for ${phone}`,
      };
    } catch (error) {
      logger.error({ error, phone, type: body.type }, 'Failed to reset rate limit');
      return reply.code(500).send({ error: 'Failed to reset rate limit' });
    }
  });
};
