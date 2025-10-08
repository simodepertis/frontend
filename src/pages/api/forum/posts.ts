import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const raw = getTokenFromRequest(req) || '';
    const payload = verifyToken(raw);
    if (!payload) return res.status(401).json({ error: 'Non autenticato' });
    
    const { threadId, body } = req.body;
    const threadIdNum = Number(threadId || 0);
    const bodyStr = String(body || '').trim().slice(0, 5000);
    
    if (!threadIdNum || !bodyStr) return res.status(400).json({ error: 'Parametri non validi' });

    const thread = await prisma.forumThread.findUnique({ where: { id: threadIdNum }, select: { id: true } });
    if (!thread) return res.status(404).json({ error: 'Discussione non trovata' });

    const created = await prisma.forumPost.create({
      data: { threadId: threadIdNum, authorId: payload.userId, body: bodyStr },
      select: { id: true, createdAt: true }
    });

    return res.json({ ok: true, id: created.id });
  } catch (e) {
    return res.status(500).json({ error: 'Errore interno' });
  }
}
