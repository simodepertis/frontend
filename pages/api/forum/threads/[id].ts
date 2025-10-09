import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const idNum = Number(req.query.id || 0);
    if (!idNum) return res.status(400).json({ error: 'ID non valido' });
    const t = await prisma.forumThread.findUnique({
      where: { id: idNum },
      select: {
        id: true,
        title: true,
        body: true,
        category: true,
        createdAt: true,
        author: { select: { id: true, nome: true } },
        posts: { orderBy: { createdAt: 'asc' }, select: { id: true, body: true, createdAt: true, author: { select: { id: true, nome: true } } } }
      }
    });
    if (!t) return res.status(404).json({ error: 'Discussione non trovata' });
    return res.status(200).json({ item: t });
  } catch (e) {
    return res.status(500).json({ error: 'Errore interno' });
  }
}
