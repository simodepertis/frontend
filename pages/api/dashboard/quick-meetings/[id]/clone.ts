import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

function getUserFromToken(req: NextApiRequest): { userId: number } | null {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      token = req.cookies['auth-token'];
    }

    if (!token) return null;

    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };

    return { userId: decoded.userId };
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = getUserFromToken(req);

  if (!auth) {
    return res.status(401).json({ error: 'Non autorizzato' });
  }

  const userId = auth.userId;
  const { id } = req.query;
  const meetingId = parseInt(id as string, 10);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  try {
    const original = await prisma.quickMeeting.findFirst({
      where: {
        id: meetingId,
        userId,
      },
    });

    if (!original) {
      return res.status(404).json({ error: 'Annuncio non trovato' });
    }

    const cloned = await prisma.quickMeeting.create({
      data: {
        title: original.title,
        description: (original as any).description ?? '',
        category: original.category,
        city: original.city,
        zone: original.zone,
        phone: original.phone,
        age: original.age,
        photos: original.photos as any,
        userId: original.userId,
        expiresAt: original.expiresAt,
        isActive: false,
      },
    });

    return res.status(201).json({ meeting: cloned });
  } catch (error) {
    console.error('Errore clone quick-meeting:', error);
    return res.status(500).json({ error: 'Errore del server' });
  }
}
