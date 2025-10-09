import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const slug = String(req.query.slug || '').trim();
    if (!slug) return res.status(400).json({ error: 'slug mancante' });
    // 1) Carica sempre le recensioni con Prisma (comportamento precedente)
    const items = await prisma.review.findMany({
      where: { status: 'APPROVED' as any, target: { slug } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true, rating: true, title: true, body: true, createdAt: true,
        author: { select: { id: true, nome: true } },
        target: { select: { id: true, nome: true, slug: true } },
      }
    });

    // 2) Prova ad arricchire con response/responseAt via SQL, ma se fallisce ignora
    try {
      if (items.length) {
        const ids = items.map(it => it.id);
        const rows = await prisma.$queryRawUnsafe<any[]>(
          `SELECT id, "response", "responseAt" FROM "Review" WHERE id = ANY($1::int[])`, ids as any
        );
        const map = new Map<number, { response: string | null, responseAt: Date | null }>();
        rows.forEach(r => map.set(Number(r.id), { response: r.response ?? null, responseAt: r.responseAt ?? null }));
        (items as any[]).forEach(it => { const m = map.get(it.id); if (m) { (it as any).response = m.response; (it as any).responseAt = m.responseAt; } });
      }
    } catch {}

    return res.status(200).json({ items });
  } catch (e) {
    return res.status(500).json({ error: 'Errore interno' });
  }
}
