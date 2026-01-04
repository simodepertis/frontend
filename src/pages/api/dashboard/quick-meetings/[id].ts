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

      // Prisma schema: alcune relazioni non sono in cascade (es. QuickMeetingPurchase -> QuickMeeting)
      // quindi cancelliamo prima i record dipendenti per evitare errori FK.
      await prisma.$transaction([
        // Se esistono pacchetti attivi o storici, vanno rimossi prima del QuickMeeting.
        // Gli schedule sono in cascade su QuickMeetingPurchase, quindi basta eliminare le purchase.
        prisma.quickMeetingPurchase.deleteMany({ where: { meetingId } }),
        // Queste tabelle dovrebbero essere già in cascade, ma le cancelliamo comunque per sicurezza.
        prisma.quickMeetingReview.deleteMany({ where: { quickMeetingId: meetingId } }),
        prisma.importedReview.deleteMany({ where: { quickMeetingId: meetingId } }),
        prisma.bumpLog.deleteMany({ where: { quickMeetingId: meetingId } }),
        prisma.quickMeeting.delete({ where: { id: meetingId } }),
      ]);

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Errore:', error);
      const msg = String((error as any)?.message || '');
      // Messaggio più utile in caso di vincoli DB
      if (msg.toLowerCase().includes('foreign key') || msg.toLowerCase().includes('constraint')) {
        return res.status(500).json({ error: 'Impossibile eliminare: esistono dati collegati (pacchetti/relazioni). Riprova tra qualche secondo.' });
      }
      return res.status(500).json({ error: 'Errore del server' });
    }
  } 
  
  else {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }
}
