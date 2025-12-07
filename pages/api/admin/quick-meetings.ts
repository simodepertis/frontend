import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || '';
  const decoded = token ? verifyToken(token) : null;

  if (!decoded) return res.status(401).json({ error: 'Token non valido' });

  const me = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { ruolo: true } });
  if (me?.ruolo !== 'admin') return res.status(403).json({ error: 'Accesso negato' });

  if (req.method === 'GET') {
    try {
      const userIdParam = req.query.userId;
      const where: any = {};

      if (userIdParam && typeof userIdParam === 'string') {
        const uid = parseInt(userIdParam, 10);
        if (!Number.isNaN(uid)) where.userId = uid;
      }

      const meetings = await prisma.quickMeeting.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 200,
      });

      return res.status(200).json({ meetings });
    } catch (error) {
      console.error('❌ GET /admin/quick-meetings error', error);
      return res.status(500).json({ error: 'Errore interno del server' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'ID mancante' });
      }
      const meetingId = parseInt(id, 10);
      if (!Number.isFinite(meetingId)) {
        return res.status(400).json({ error: 'ID non valido' });
      }

      await prisma.quickMeeting.delete({ where: { id: meetingId } });
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('❌ DELETE /admin/quick-meetings error', error);
      return res.status(500).json({ error: 'Errore interno del server' });
    }
  }

  return res.status(405).json({ error: 'Metodo non consentito' });
}
