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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const raw = getBearer(req);
    const payload = verifyToken(raw || '');
    if (!payload) return res.status(401).json({ error: 'Non autenticato' });

    const { targetUserId, body } = req.body || {};
    const targetIdNum = Number(targetUserId);
    const text = String(body || '').slice(0,2000);
    if (!targetIdNum || !text) {
      return res.status(400).json({ error: 'Parametri non validi' });
    }
    const status = process.env.NODE_ENV !== 'production' ? 'APPROVED' : 'IN_REVIEW';
    const created = await prisma.comment.create({ data: {
      authorId: payload.userId,
      targetUserId: targetIdNum,
      body: text,
      status: status as any,
    }});
    return res.status(200).json({ ok: true, comment: { id: created.id, status: created.status } });
  } catch (e) {
    return res.status(500).json({ error: 'Errore interno' });
  }
}
