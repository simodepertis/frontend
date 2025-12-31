import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { QuickMeetingCategory } from '@prisma/client';

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
    // Prisma Json can come back as object wrappers in edge-cases
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

// Consenti body JSON molto grande (foto in base64) per la creazione di annunci con molte immagini
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

  if (req.method === 'GET') {
    try {
      const meetings = await prisma.quickMeeting.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      const safeMeetings = meetings.map((m) => ({
        ...m,
        photos: sanitizePhotos((m as any).photos),
      }));

      return res.status(200).json({ meetings: safeMeetings });
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

      const safePhotos = sanitizePhotos(photos);

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
          photos: safePhotos,
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
