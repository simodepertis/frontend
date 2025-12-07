import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const auth = req.headers.authorization?.replace('Bearer ', '') || '';
    if (!auth) return res.status(200).json({ hasAccess: false });
    const payload = verifyToken(auth);
    if (!payload) return res.status(200).json({ hasAccess: false });

    const idParam = req.query.id;
    if (!idParam || Array.isArray(idParam)) return res.status(400).json({ error: 'ID non valido' });
    const streetEscortId = parseInt(idParam, 10);
    if (!Number.isFinite(streetEscortId)) return res.status(400).json({ error: 'ID non valido' });

    const tx = await prisma.creditTransaction.findFirst({
      where: {
        userId: payload.userId,
        type: 'PURCHASE',
        meta: {
          path: ['kind'],
          equals: 'street_reviews_access',
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!tx) return res.status(200).json({ hasAccess: false });

    const meta: any = tx.meta || {};
    const metaEscortId = Number(meta.streetEscortId ?? 0);
    if (!Number.isFinite(metaEscortId) || metaEscortId !== streetEscortId) {
      return res.status(200).json({ hasAccess: false });
    }

    return res.status(200).json({ hasAccess: true });
  } catch (e) {
    console.error('street-fireflies reviews-access error', e);
    return res.status(500).json({ error: 'Errore interno' });
  }
}
