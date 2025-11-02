import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

function getUserId(req: NextApiRequest): number | null {
  const auth = req.headers.authorization
  const token = auth?.startsWith('Bearer ') ? auth.substring(7) : (req.cookies as any)['auth-token']
  if (!token) return null
  const payload = verifyToken(token)
  return payload?.userId ?? null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getUserId(req);

  if (!userId) {
    return res.status(401).json({ error: 'Non autorizzato' });
  }
  const { id } = req.query;
  const meetingId = parseInt(id as string);

  if (req.method === 'GET') {
    try {
      const meeting = await prisma.quickMeeting.findFirst({
        where: { 
          id: meetingId,
          userId 
        }
      });

      if (!meeting) {
        return res.status(404).json({ error: 'Annuncio non trovato' });
      }

      return res.status(200).json({ meeting });
    } catch (error) {
      console.error('Errore:', error);
      return res.status(500).json({ error: 'Errore del server' });
    }
  } 
  
  else if (req.method === 'PATCH') {
    try {
      const meeting = await prisma.quickMeeting.findFirst({
        where: { id: meetingId, userId }
      });

      if (!meeting) {
        return res.status(404).json({ error: 'Annuncio non trovato' });
      }

      const updated = await prisma.quickMeeting.update({
        where: { id: meetingId },
        data: req.body
      });

      return res.status(200).json({ meeting: updated });
    } catch (error) {
      console.error('Errore:', error);
      return res.status(500).json({ error: 'Errore del server' });
    }
  } 
  
  else if (req.method === 'DELETE') {
    try {
      const meeting = await prisma.quickMeeting.findFirst({
        where: { id: meetingId, userId }
      });

      if (!meeting) {
        return res.status(404).json({ error: 'Annuncio non trovato' });
      }

      await prisma.quickMeeting.delete({
        where: { id: meetingId }
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Errore:', error);
      return res.status(500).json({ error: 'Errore del server' });
    }
  } 
  
  else {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }
}
