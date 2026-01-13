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

      const scope = String(req.query.scope || '').toLowerCase();
      const take = Math.max(1, Math.min(500, Number(req.query.take) || 200));
      const skip = Math.max(0, Number(req.query.skip) || 0);
      const meetingId = Number(req.query.meetingId || 0);
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

      // Default behavior (for existing moderation page): only pending + visible
      const where: any = scope === 'all'
        ? {}
        : { isApproved: false, isVisible: true };

      if (Number.isFinite(meetingId) && meetingId > 0) {
        where.quickMeetingId = meetingId;
      }

      if (q) {
        where.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { reviewText: { contains: q, mode: 'insensitive' } },
          { user: { is: { email: { contains: q, mode: 'insensitive' } } } },
          { user: { is: { nome: { contains: q, mode: 'insensitive' } } } },
          { quickMeeting: { is: { title: { contains: q, mode: 'insensitive' } } } },
        ];
      }

      const [items, total] = await Promise.all([
        prisma.quickMeetingReview.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take,
          skip,
          select: {
            id: true,
            title: true,
            rating: true,
            reviewText: true,
            createdAt: true,
            isApproved: true,
            isVisible: true,
            user: {
              select: { id: true, nome: true, email: true }
            },
            quickMeeting: {
              select: { id: true, title: true }
            }
          }
        }),
        prisma.quickMeetingReview.count({ where }),
      ]);

      return res.status(200).json({ items, total, take, skip, scope: scope || 'pending' });
    } catch (e) {
      console.error('Errore API admin quick-meeting-reviews:', e);
      return res.status(500).json({ error: 'Errore interno' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const adm = await requireAdmin(req);
      if (!adm) return res.status(403).json({ error: 'Non autorizzato' });

      const idRaw = (req.query.id ?? (typeof req.body === 'string' ? JSON.parse(req.body).id : req.body?.id)) as any;
      const idNum = Number(idRaw || 0);
      if (!idNum) return res.status(400).json({ error: 'Parametri non validi' });

      await prisma.quickMeetingReview.delete({ where: { id: idNum } });
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error('Errore DELETE quick-meeting-review:', e);
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
      
      if (!idNum || !['approve','reject'].includes(act)) {
        return res.status(400).json({ error: 'Parametri non validi' });
      }

      if (act === 'approve') {
        const item = await prisma.quickMeetingReview.update({
          where: { id: idNum },
          data: { isApproved: true }
        });
        return res.status(200).json({ ok: true, item });
      } else {
        // Rifiuta = elimina
        await prisma.quickMeetingReview.delete({ where: { id: idNum } });
        return res.status(200).json({ ok: true });
      }
    } catch (e) {
      console.error('Errore PATCH:', e);
      return res.status(500).json({ error: 'Errore interno' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
