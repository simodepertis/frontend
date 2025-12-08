import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

function getBearer(req: NextApiRequest): string | null {
  const h = req.headers['authorization'];
  if (!h) return null;
  const m = /Bearer\s+(.+)/i.exec(Array.isArray(h) ? h[0] : h);
  return m ? m[1] : null;
}

async function requireAdmin(req: NextApiRequest) {
  const raw = getBearer(req);
  if (!raw) return null;
  const payload = verifyToken(raw);
  if (!payload) return null;
  const u = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!u) return null;
  const whitelist = new Set(['admin@local', 'musicamagazine23@gmail.com']);
  if (u.ruolo === 'admin' || whitelist.has(u.email)) return payload;
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const adm = await requireAdmin(req);
      if (!adm) return res.status(403).json({ error: 'Non autorizzato' });

      const items = await prisma.streetFireflyReview.findMany({
        where: { isApproved: false, isVisible: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          id: true,
          title: true,
          rating: true,
          reviewText: true,
          createdAt: true,
          isApproved: true,
          user: { select: { id: true, nome: true, email: true } },
          streetEscort: { select: { id: true, name: true, city: true } },
        },
      });

      return res.status(200).json({ items });
    } catch (e) {
      console.error('Errore API admin street-fireflies-reviews:', e);
      return res.status(500).json({ error: 'Errore interno' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const adm = await requireAdmin(req);
      if (!adm) return res.status(403).json({ error: 'Non autorizzato' });

      const { id, action } = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const idNum = Number(id || 0);
      const act = String(action || '').toLowerCase();

      if (!idNum || !['approve', 'reject'].includes(act)) {
        return res.status(400).json({ error: 'Parametri non validi' });
      }

      if (act === 'approve') {
        const item = await prisma.streetFireflyReview.update({
          where: { id: idNum },
          data: { isApproved: true },
        });
        return res.status(200).json({ ok: true, item });
      }

      await prisma.streetFireflyReview.delete({ where: { id: idNum } });
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error('Errore PATCH admin street-fireflies-reviews:', e);
      return res.status(500).json({ error: 'Errore interno' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
