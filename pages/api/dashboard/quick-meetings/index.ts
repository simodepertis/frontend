import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { QuickMeetingCategory } from '@prisma/client';

// Consenti body JSON molto grande (foto in base64) per la creazione di annunci con molte immagini
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '800mb'
    }
  }
};

// Helper per verificare autenticazione
function getUserFromToken(req: NextApiRequest): { userId: number } | null {
  try {
    const token = req.cookies['auth-token'];
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
