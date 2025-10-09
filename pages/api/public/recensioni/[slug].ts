import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const slug = String(req.query.slug || '').trim();
    if (!slug) return res.status(400).json({ error: 'slug mancante' });
    const items = await prisma.review.findMany({
      where: {
        status: 'APPROVED' as any,
        target: { slug }
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        rating: true,
        title: true,
        body: true,
        createdAt: true,
        author: { select: { id: true, nome: true } },
        target: { select: { id: true, nome: true, slug: true } },
      }
    });
    return res.status(200).json({ items });
  } catch (e) {
    return res.status(500).json({ error: 'Errore interno' });
  }
}
