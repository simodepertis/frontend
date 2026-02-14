import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, QuickMeetingCategory, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { category, city, phone, limit = '20', page = '1' } = req.query;

      const normalizePhoneQuery = (raw: unknown) => {
        const s = String(raw || '').trim();
        if (!s) return '';
        return s.replace(/\D/g, '');
      };

      const where: any = {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }, // Solo annunci non scaduti
        ],
      };

      if (category && category !== 'all') {
        where.category = category as QuickMeetingCategory;
      }

      if (city) {
        where.city = city;
      }

      const phoneDigits = normalizePhoneQuery(phone);
      if (phoneDigits && phoneDigits.length >= 2) {
        // Robust search: normalize phone/whatsapp in DB to digits and apply LIKE.
        // This avoids false negatives when DB stores formatted numbers (spaces/dashes/+39).
        const q = `%${phoneDigits}%`;

        const andSql: Prisma.Sql[] = [
          Prisma.sql`"isActive" = true`,
          Prisma.sql`("expiresAt" IS NULL OR "expiresAt" >= NOW())`,
        ];

        if (category && category !== 'all') {
          andSql.push(Prisma.sql`"category" = ${category as any}`);
        }
        if (city) {
          andSql.push(Prisma.sql`"city" = ${city as any}`);
        }

        const andWhere = andSql.reduce((acc, cur, idx) => {
          if (idx === 0) return cur;
          return Prisma.sql`${acc} AND ${cur}`;
        }, Prisma.sql``);

        const rows = await prisma.$queryRaw<{ id: number }[]>(
          Prisma.sql`
            SELECT "id"
            FROM "QuickMeeting"
            WHERE ${andWhere}
            AND (
              regexp_replace(COALESCE("phone", ''), '\\D', '', 'g') LIKE ${q}
              OR regexp_replace(COALESCE("whatsapp", ''), '\\D', '', 'g') LIKE ${q}
            )
          `
        );

        const ids = rows.map((r) => r.id);
        // If no matches, short-circuit to an impossible condition
        where.id = ids.length ? { in: ids } : { in: [-1] };
      }

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const superTopWhere = { ...where, bumpPackage: 'SUPERTOP' as const };
      const normalWhere = { ...where, NOT: { bumpPackage: 'SUPERTOP' as const } };

      const [superTopMeetings, meetings, total] = await Promise.all([
        prisma.quickMeeting.findMany({
          where: superTopWhere,
          orderBy: [{ publishedAt: 'desc' }],
          take: 12,
        }),
        prisma.quickMeeting.findMany({
          where: normalWhere,
          orderBy: [{ publishedAt: 'desc' }],
          skip,
          take,
        }),
        prisma.quickMeeting.count({ where: normalWhere }),
      ]);

      const meetingIds = [...superTopMeetings, ...meetings].map((m) => m.id)
      const ratingsAgg = meetingIds.length
        ? await prisma.quickMeetingReview.groupBy({
            by: ['quickMeetingId'],
            where: {
              quickMeetingId: { in: meetingIds },
              isApproved: true,
              isVisible: true,
            },
            _avg: { rating: true },
            _count: { _all: true },
          })
        : []

      const ratingByMeeting = new Map<number, { avg: number | null; count: number }>()
      for (const r of ratingsAgg as any[]) {
        ratingByMeeting.set(r.quickMeetingId, {
          avg: r._avg?.rating ?? null,
          count: r._count?._all ?? 0,
        })
      }

      const enrich = (m: any) => {
        const agg = ratingByMeeting.get(m.id)
        return {
          ...m,
          avgRating: agg?.avg ?? null,
          reviewCount: agg?.count ?? 0,
        }
      }

      const superTopWithRating = superTopMeetings.map(enrich)
      const meetingsWithRating = meetings.map(enrich)

      return res.status(200).json({
        superTopMeetings: superTopWithRating,
        meetings: meetingsWithRating,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          pages: Math.ceil(total / parseInt(limit as string))
        }
      });
    } catch (error) {
      console.error('Errore nel caricamento incontri:', error);
      return res.status(500).json({ error: 'Errore del server' });
    }
  } else {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }
}
