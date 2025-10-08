import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const limit = Math.min(Number(req.query.limit || 20), 100);
      const category = req.query.category as string || undefined;

      const where = category ? { category } : {};
      const items = await prisma.forumThread.findMany({
        where: where as any,
        orderBy: { createdAt: 'desc' },
        take: isNaN(limit) ? 20 : limit,
        select: {
          id: true,
          title: true,
          body: true,
          category: true,
          createdAt: true,
          author: { select: { id: true, nome: true } },
          _count: { select: { posts: true } }
        }
      });
      return res.json({ items });
    } catch (e) {
      return res.status(500).json({ error: 'Errore interno' });
    }
  }

  if (req.method === 'POST') {
    try {
      const raw = getTokenFromRequest(req) || '';
      const payload = verifyToken(raw);
      if (!payload) return res.status(401).json({ error: 'Non autenticato' });
      
      const { title, body, category } = req.body;
      const titleStr = String(title || '').trim().slice(0, 200);
      const bodyStr = String(body || '').trim().slice(0, 5000);
      const categoryStr = String(category || 'generale').slice(0, 30);
      
      if (!titleStr || !bodyStr) return res.status(400).json({ error: 'Titolo e testo obbligatori' });

      const created = await prisma.forumThread.create({
        data: {
          authorId: payload.userId,
          title: titleStr,
          body: bodyStr,
          category: categoryStr,
        },
        select: { id: true }
      });
      return res.json({ ok: true, id: created.id });
    } catch (e) {
      return res.status(500).json({ error: 'Errore interno' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
