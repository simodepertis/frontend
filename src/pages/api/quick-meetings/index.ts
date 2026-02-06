import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, QuickMeetingCategory } from '@prisma/client';

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
        expiresAt: {
          gte: new Date() // Solo annunci non scaduti
        }
      };

      if (category && category !== 'all') {
        where.category = category as QuickMeetingCategory;
      }

      if (city) {
        where.city = city;
      }

      const phoneDigits = normalizePhoneQuery(phone);
      if (phoneDigits && phoneDigits.length >= 4) {
        const variants = new Set<string>();
        variants.add(phoneDigits);

        // If user typed a local Italian number (e.g. 333...), also try adding country code
        if (!phoneDigits.startsWith('39') && phoneDigits.length >= 8) {
          variants.add(`39${phoneDigits}`);
        }
        // If user typed with country code, also try without it (common DB formats)
        if (phoneDigits.startsWith('39') && phoneDigits.length > 10) {
          variants.add(phoneDigits.slice(2));
        }

        where.OR = Array.from(variants).flatMap((v) => [
          { phone: { contains: v } },
          { whatsapp: { contains: v } },
          { phone: { contains: `+${v}` } },
          { whatsapp: { contains: `+${v}` } },
        ]);
      }

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const [meetings, total] = await Promise.all([
        prisma.quickMeeting.findMany({
          where,
          orderBy: [
            { publishedAt: 'desc' }
          ],
          skip,
          take
        }),
        prisma.quickMeeting.count({ where })
      ]);

      const meetingIds = meetings.map((m) => m.id)
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

      const meetingsWithRating = meetings.map((m: any) => {
        const agg = ratingByMeeting.get(m.id)
        return {
          ...m,
          avgRating: agg?.avg ?? null,
          reviewCount: agg?.count ?? 0,
        }
      })

      return res.status(200).json({
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
