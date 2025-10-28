import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const meeting = await prisma.quickMeeting.findUnique({
        where: { id: parseInt(id as string) },
        include: {
          importedReviews: {
            orderBy: {
              reviewDate: 'desc'
            }
          }
        }
      });

      if (!meeting) {
        return res.status(404).json({ error: 'Incontro non trovato' });
      }

      return res.status(200).json({ 
        meeting: {
          ...meeting,
          reviewCount: meeting.importedReviews?.length || 0
        }
      });
    } catch (error) {
      console.error('Errore nel caricamento incontro:', error);
      return res.status(500).json({ error: 'Errore del server' });
    }
  } else if (req.method === 'PATCH') {
    try {
      const meetingId = parseInt(id as string, 10);
      const {
        title,
        description,
        category,
        city,
        zone,
        phone,
        age,
        photos,
        isActive
      } = req.body || {};

      const data: any = {};
      if (typeof title === 'string') data.title = title.slice(0, 200);
      if (typeof description === 'string') data.description = description;
      if (typeof category === 'string') data.category = category;
      if (typeof city === 'string') data.city = city.toUpperCase();
      if (typeof zone === 'string' || zone === null) data.zone = zone || null;
      if (typeof phone === 'string' || typeof phone === 'number' || phone === null) {
        const p = phone == null ? null : String(phone).trim();
        data.phone = p && p.length > 0 ? p : null;
      }
      if (typeof age === 'number' || age === null) data.age = age ?? null;
      if (Array.isArray(photos)) data.photos = photos.filter((x: any) => typeof x === 'string' && x.trim().length > 0);
      if (typeof isActive === 'boolean') data.isActive = isActive;

      const updated = await prisma.quickMeeting.update({
        where: { id: meetingId },
        data
      });

      return res.status(200).json({ meeting: updated });
    } catch (error) {
      console.error('Errore update incontro:', error);
      return res.status(500).json({ error: 'Errore del server' });
    }
  } else {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }
}
