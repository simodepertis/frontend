import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, QuickMeetingCategory } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { category, city, limit = '20', page = '1' } = req.query;

      const where: any = {
        isActive: true,
        expiresAt: {
          gte: new Date() // Solo annunci non scaduti
        }
      };

      if (category && category !== 'all') {
        where.category = category as QuickMeetingCategory;
      }

      if (city) {
        where.city = city;
      }

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const [meetings, total] = await Promise.all([
        prisma.quickMeeting.findMany({
          where,
          orderBy: [
            { publishedAt: 'desc' }
          ],
          skip,
          take
        }),
        prisma.quickMeeting.count({ where })
      ]);

      return res.status(200).json({
        meetings,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          pages: Math.ceil(total / parseInt(limit as string))
        }
      });
    } catch (error) {
      console.error('Errore nel caricamento incontri:', error);
      return res.status(500).json({ error: 'Errore del server' });
    }
  } else {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }
}
