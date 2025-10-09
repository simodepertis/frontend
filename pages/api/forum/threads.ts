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
  if (req.method === 'GET') {
    try {
      const limit = Math.min(Number(req.query.limit || 20), 100);
      const category = req.query.category ? String(req.query.category) : undefined;
      const where = category ? { category } : {} as any;
      const items = await prisma.forumThread.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          title: true,
          body: true,
          category: true,
          createdAt: true,
          author: { select: { id: true, nome: true } },
          _count: { select: { posts: true } },
        }
      });
      return res.status(200).json({ items });
    } catch (e) {
      return res.status(500).json({ error: 'Errore interno' });
    }
  }
  if (req.method === 'POST') {
    try {
      const raw = getBearer(req);
      const payload = verifyToken(raw || '');
      if (!payload) return res.status(401).json({ error: 'Non autenticato' });
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const title = String(body?.title || '').trim().slice(0, 200);
      const text = String(body?.body || '').trim().slice(0, 5000);
      const category = String(body?.category || 'generale').slice(0, 30);
      if (!title || !text) return res.status(400).json({ error: 'Titolo e testo obbligatori' });
      const created = await prisma.forumThread.create({ data: { authorId: payload.userId, title, body: text, category }, select: { id: true } });
      return res.status(200).json({ ok: true, id: created.id });
    } catch (e) {
      return res.status(500).json({ error: 'Errore interno' });
    }
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
