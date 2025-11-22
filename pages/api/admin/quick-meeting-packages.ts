import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const items = await prisma.quickMeetingProduct.findMany({
        orderBy: [{ type: 'asc' }, { durationDays: 'asc' }],
      });
      return res.status(200).json({ items });
    }

    if (req.method === 'PATCH') {
      const { id, creditsCost } = req.body as { id?: number; creditsCost?: number };
      if (!id || typeof creditsCost !== 'number' || creditsCost <= 0) {
        return res.status(400).json({ error: 'Parametri non validi' });
      }

      const updated = await prisma.quickMeetingProduct.update({
        where: { id },
        data: { creditsCost },
      });
      return res.status(200).json({ item: updated });
    }

    return res.status(405).json({ error: 'Metodo non consentito' });
  } catch (e) {
    console.error('Errore admin quick-meeting-packages:', e);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
}
