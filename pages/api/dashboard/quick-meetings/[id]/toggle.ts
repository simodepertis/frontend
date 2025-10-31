import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// Helper per verificare autenticazione
function getUserFromToken(req: NextApiRequest): { userId: number } | null {
  try {
    const token = req.cookies['auth-token'];
    if (!token) return null;
    
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
    
    return { userId: decoded.userId };
  } catch (error) {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  // Verifica autenticazione
  const auth = getUserFromToken(req);
  
  if (!auth) {
    return res.status(401).json({ error: 'Non autorizzato' });
  }

  const userId = auth.userId;
  const { id } = req.query;
  const { isActive } = req.body;
  const meetingId = parseInt(id as string);

  try {
    const meeting = await prisma.quickMeeting.findFirst({
      where: { id: meetingId, userId }
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Annuncio non trovato' });
    }

    const updated = await prisma.quickMeeting.update({
      where: { id: meetingId },
      data: { isActive }
    });

    return res.status(200).json({ meeting: updated });
  } catch (error) {
    console.error('Errore:', error);
    return res.status(500).json({ error: 'Errore del server' });
  }
}
