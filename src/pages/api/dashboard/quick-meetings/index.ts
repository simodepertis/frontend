import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { PrismaClient, QuickMeetingCategory } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Non autorizzato' });
  }

  const userId = parseInt(session.user.id as string);

  if (req.method === 'GET') {
    try {
      const meetings = await prisma.quickMeeting.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      return res.status(200).json({ meetings });
    } catch (error) {
      console.error('Errore caricamento:', error);
      return res.status(500).json({ error: 'Errore del server' });
    }
  } 
  
  else if (req.method === 'POST') {
    try {
      const {
        title,
        description,
        category,
        city,
        zone,
        phone,
        whatsapp,
        age,
        photos,
        expiresAt
      } = req.body;

      // Validazione
      if (!title || !category || !city || !phone) {
        return res.status(400).json({ error: 'Campi obbligatori mancanti' });
      }

      if (!Object.values(QuickMeetingCategory).includes(category)) {
        return res.status(400).json({ error: 'Categoria non valida' });
      }

      const meeting = await prisma.quickMeeting.create({
        data: {
          title,
          description,
          category: category as QuickMeetingCategory,
          city: city.toUpperCase(),
          zone,
          phone,
          whatsapp,
          age: age ? parseInt(age) : null,
          photos: photos || [],
          userId,
          expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });

      return res.status(201).json({ meeting });
    } catch (error) {
      console.error('Errore creazione:', error);
      return res.status(500).json({ error: 'Errore del server' });
    }
  } 
  
  else {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }
}
