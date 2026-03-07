import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Metodo non consentito' });

  try {
    const { city, id } = req.query as { city?: string; id?: string };

    if (id) {
      const sid = Number(id || 0);
      if (!sid) return res.status(400).json({ error: 'ID non valido' });
      const item = await prisma.streetEscort.findFirst({
        where: { id: sid, active: true },
        include: { photos: true },
      });
      if (!item) return res.status(404).json({ error: 'Non trovato' });
      return res.status(200).json({ item });
    }

    const where: any = {
      active: true,
      lat: { not: null },
      lon: { not: null },
    };

    if (city && typeof city === 'string' && city.trim()) {
      where.city = { equals: city.trim(), mode: 'insensitive' };
    }

    const items = await prisma.streetEscort.findMany({
      where,
      orderBy: { id: 'desc' },
      take: 300,
      include: {
        photos: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const ids = items.map((x) => x.id);
    const stats = ids.length
      ? await prisma.streetFireflyReview.groupBy({
          by: ['streetEscortId'],
          where: {
            streetEscortId: { in: ids },
            isApproved: true,
            isVisible: true,
          },
          _avg: { rating: true },
          _count: { _all: true },
        })
      : [];

    const statsById = new Map<number, { avgRating: number | null; reviewCount: number }>();
    for (const s of stats) {
      statsById.set(s.streetEscortId, {
        avgRating: typeof s._avg.rating === 'number' ? s._avg.rating : null,
        reviewCount: typeof s._count._all === 'number' ? s._count._all : 0,
      });
    }

    const mapped = items.map((it) => {
      const st = statsById.get(it.id) || { avgRating: null, reviewCount: 0 };
      const coverUrl = it.photos && it.photos[0] ? it.photos[0].url : null;
      return {
        ...it,
        coverUrl,
        avgRating: st.avgRating,
        reviewCount: st.reviewCount,
        // avoid sending heavy relation
        photos: undefined,
      };
    });

    return res.status(200).json({ items: mapped });
  } catch (err) {
    console.error('API /api/public/street-fireflies errore:', err);
    return res.status(500).json({ error: 'Errore interno' });
  }
}
