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
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const threadId = Number(body?.threadId || 0);
    const text = String(body?.body || '').trim().slice(0,5000);
    if (!threadId || !text) return res.status(400).json({ error: 'Parametri non validi' });
    const thread = await prisma.forumThread.findUnique({ where: { id: threadId }, select: { id: true } });
    if (!thread) return res.status(404).json({ error: 'Discussione non trovata' });
    const created = await prisma.forumPost.create({ data: { threadId, authorId: payload.userId, body: text }, select: { id: true } });
    return res.status(200).json({ ok: true, id: created.id });
  } catch (e) {
    return res.status(500).json({ error: 'Errore interno' });
  }
}
