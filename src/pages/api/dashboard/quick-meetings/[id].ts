import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Non autorizzato' });
  }

  const userId = parseInt(session.user.id as string);
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
