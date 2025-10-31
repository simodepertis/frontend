import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Non autorizzato' });
  }

  const userId = parseInt(session.user.id as string);
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
