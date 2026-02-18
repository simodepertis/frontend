import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || '';
  const decoded = token ? verifyToken(token) : null;

  if (!decoded) return res.status(401).json({ error: 'Token non valido' });

  const me = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { ruolo: true } });
  if (me?.ruolo !== 'admin') return res.status(403).json({ error: 'Accesso negato' });

  if (req.method === 'GET') {
    try {
      const userIdParam = req.query.userId;
      const qParam = req.query.q;
      const takeParam = req.query.take;
      const skipParam = req.query.skip;
      const typeParam = req.query.type;
      const type = typeof typeParam === 'string' ? typeParam : 'both';

      const take = Math.max(1, Math.min(1000, Number(Array.isArray(takeParam) ? takeParam[0] : takeParam) || 200));
      const skip = Math.max(0, Number(Array.isArray(skipParam) ? skipParam[0] : skipParam) || 0);

      const where: any = {};
      if (userIdParam && typeof userIdParam === 'string') {
        const uid = parseInt(userIdParam, 10);
        if (!Number.isNaN(uid)) where.userId = uid;
      }

      const q = typeof qParam === 'string' ? qParam.trim() : '';
      if (q) {
        where.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { city: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
          { sourceId: { contains: q, mode: 'insensitive' } },
          { sourceUrl: { contains: q, mode: 'insensitive' } },
        ];
      }

      const now = new Date();
      const includePurchases = {
        quickMeetingPurchases: {
          where: {
            status: 'ACTIVE',
            expiresAt: { gt: now },
          },
          include: {
            product: {
              select: {
                code: true,
                label: true,
                type: true,
                durationDays: true,
              },
            },
          },
        },
      } as const;

      // Split queries so SuperTop are never truncated by pagination on normal meetings.
      const superTopPurchaseWhere: any = {
        status: 'ACTIVE',
        expiresAt: { gt: now },
        OR: [
          { product: { code: 'SUPERTOP' } },
          { product: { code: { startsWith: 'SUPERTOP_' } } },
        ],
      };

      const superTopClause: any = {
        OR: [
          { bumpPackage: 'SUPERTOP' },
          { quickMeetingPurchases: { some: superTopPurchaseWhere } },
        ],
      };

      const superTopWhere: any = {
        ...where,
        ...superTopClause,
      };

      const normalWhere: any = {
        ...where,
        AND: [
          {
            OR: [{ bumpPackage: null }, { bumpPackage: { not: 'SUPERTOP' } }],
          },
          {
            quickMeetingPurchases: {
              none: superTopPurchaseWhere,
            },
          },
        ],
      };

      const needSuper = type === 'both' || type === 'supertop';
      const needNormal = type === 'both' || type === 'normal';

      const [superTopRaw, normalRaw, superTopTotal, normalTotal] = await Promise.all([
        needSuper
          ? prisma.quickMeeting.findMany({
              where: superTopWhere,
              orderBy: { createdAt: 'desc' },
              take: 2000,
              include: includePurchases,
            })
          : Promise.resolve([] as any[]),
        needNormal
          ? prisma.quickMeeting.findMany({
              where: normalWhere,
              orderBy: { createdAt: 'desc' },
              skip,
              take,
              include: includePurchases,
            })
          : Promise.resolve([] as any[]),
        prisma.quickMeeting.count({ where: superTopWhere }),
        prisma.quickMeeting.count({ where: normalWhere }),
      ]);

      function decorate(m: any) {
        const activeProducts = Array.isArray(m.quickMeetingPurchases)
          ? m.quickMeetingPurchases.map((p: any) => p?.product).filter(Boolean)
          : [];
        const hasSuperTopPurchase = activeProducts.some((p: any) => {
          if (typeof p?.code !== 'string') return false;
          return p.code === 'SUPERTOP' || p.code.startsWith('SUPERTOP_');
        });
        const isSuperTop = hasSuperTopPurchase || String(m.bumpPackage || '').toUpperCase() === 'SUPERTOP';
        return {
          ...m,
          isSuperTop,
          activePackages: activeProducts,
        };
      }

      const superTopMeetings = superTopRaw.map(decorate);
      const normalMeetings = normalRaw.map(decorate);

      const visibleClause: any = {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
      };

      const [superTopVisible, normalVisible] = await Promise.all([
        prisma.quickMeeting.count({ where: { ...superTopWhere, ...visibleClause } }),
        prisma.quickMeeting.count({ where: { ...normalWhere, ...visibleClause } }),
      ]);

      return res.status(200).json({
        superTopMeetings,
        normalMeetings,
        counts: {
          superTop: superTopTotal,
          normal: normalTotal,
          superTopVisible,
          normalVisible,
        },
        take,
        skip,
      });
    } catch (error) {
      console.error('❌ GET /admin/quick-meetings error', error);
      return res.status(500).json({ error: 'Errore interno del server' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'ID mancante' });
      }
      const meetingId = parseInt(id, 10);
      if (!Number.isFinite(meetingId)) {
        return res.status(400).json({ error: 'ID non valido' });
      }

      await prisma.$transaction(async (tx) => {
        await tx.quickMeetingBumpSchedule.deleteMany({
          where: {
            purchase: {
              meetingId,
            },
          },
        });

        await tx.quickMeetingPurchase.deleteMany({
          where: {
            meetingId,
          },
        });

        await tx.quickMeeting.delete({ where: { id: meetingId } });
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('❌ DELETE /admin/quick-meetings error', error);
      return res.status(500).json({ error: 'Errore interno del server' });
    }
  }

  return res.status(405).json({ error: 'Metodo non consentito' });
}
