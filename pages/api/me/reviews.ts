import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

function getBearer(req: NextApiRequest): string | null {
  const h = req.headers['authorization'];
  if (!h) return null;
  const m = /Bearer\s+(.+)/i.exec(Array.isArray(h) ? h[0] : h);
  return m ? m[1] : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const raw = getBearer(req) || '';
    const payload = verifyToken(raw);
    if (!payload) return res.status(401).json({ error: 'Non autenticato' });

    const type = String((req.query.type as string) || 'received'); // 'received' | 'written'

    if (type === 'written') {
      const items = await prisma.review.findMany({
        where: { authorId: payload.userId },
        orderBy: { createdAt: 'desc' },
        take: 200,
        select: {
          id: true, rating: true, title: true, body: true, createdAt: true,
          target: { select: { id: true, nome: true, slug: true } }
        }
      });
      return res.status(200).json({ items });
    } else {
      const items = await prisma.review.findMany({
        where: { targetUserId: payload.userId },
        orderBy: { createdAt: 'desc' },
        take: 200,
        select: {
          id: true, rating: true, title: true, body: true, createdAt: true,
          author: { select: { id: true, nome: true } }
        }
      });
      return res.status(200).json({ items });
    }
  } catch (e) {
    return res.status(500).json({ error: 'Errore interno' });
  }
}
