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

    const items = await prisma.streetEscort.findMany({
      where,
      orderBy: { id: 'desc' },
      take: 300,
    });

    return res.status(200).json({ items });
  } catch (err) {
    console.error('API /api/public/street-fireflies errore:', err);
    return res.status(500).json({ error: 'Errore interno' });
  }
}
