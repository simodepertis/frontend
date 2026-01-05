import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

function normalizeUploadUrl(u: string | null | undefined): string {
  const s = String(u || '').trim();
  if (!s) return '';
  if (s.startsWith('/uploads/')) return `/api${s}`;
  return s;
}

function sanitizePhotos(input: any): string[] {
  let arr: any[] = [];
  if (Array.isArray(input)) {
    arr = input;
  } else if (typeof input === 'string') {
    const s = input.trim();
    if (!s) return [];
    if (s.startsWith('[')) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) arr = parsed;
        else arr = [s];
      } catch {
        arr = [s];
      }
    } else {
      arr = [s];
    }
  } else if (input && typeof input === 'object') {
    const maybe = (input as any).photos;
    if (Array.isArray(maybe)) arr = maybe;
  }

  return arr
    .filter((x) => typeof x === 'string')
    .map((x) => String(x).trim())
    .filter((x) => x.length > 0)
    .filter((x) => !x.startsWith('data:'))
    .filter((x) => x.length < 8192)
    .map((x) => normalizeUploadUrl(x));
}

// Consenti un body JSON molto grande per aggiornare annunci con molte foto in base64
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '800mb'
    }
  }
};

// Helper per verificare autenticazione (supporta sia cookie che header Authorization Bearer)
function getUserFromToken(req: NextApiRequest): { userId: number } | null {
  try {
    let token: string | undefined;

    // 1) Prova header Authorization: Bearer <token>
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // 2) Fallback: cookie auth-token
    if (!token) {
      token = req.cookies['auth-token'];
    }

    if (!token) return null;

    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
    
    return { userId: decoded.userId };
  } catch (error) {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verifica autenticazione
  const auth = getUserFromToken(req);
  
  if (!auth) {
    return res.status(401).json({ error: 'Non autorizzato' });
  }

  const userId = auth.userId;
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

      return res.status(200).json({ meeting: { ...meeting, photos: sanitizePhotos((meeting as any).photos) } });
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

      const body: any = req.body || {};
      const data: any = { ...body };
      if ('photos' in data) data.photos = sanitizePhotos(data.photos);

      const updated = await prisma.quickMeeting.update({
        where: { id: meetingId },
        data
      });

      return res.status(200).json({ meeting: { ...updated, photos: sanitizePhotos((updated as any).photos) } });
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

      await prisma.$transaction(async (tx) => {
        // Elimina prima le schedules collegate alle purchases del meeting (FK)
        await tx.quickMeetingBumpSchedule.deleteMany({
          where: {
            purchase: {
              meetingId,
            },
          },
        });

        // Elimina le purchases collegate (FK)
        await tx.quickMeetingPurchase.deleteMany({
          where: {
            meetingId,
          },
        });

        // Infine elimina il meeting (altre relazioni hanno onDelete: Cascade nello schema)
        await tx.quickMeeting.delete({
          where: { id: meetingId },
        });
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
