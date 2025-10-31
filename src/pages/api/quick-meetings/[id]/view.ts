import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'POST') {
    try {
      await prisma.quickMeeting.update({
        where: { id: parseInt(id as string) },
        data: {
          views: {
            increment: 1
          }
        }
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Errore incremento visualizzazioni:', error);
      return res.status(500).json({ error: 'Errore del server' });
    }
  } else {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }
}
