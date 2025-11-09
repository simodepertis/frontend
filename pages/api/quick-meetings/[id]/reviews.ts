import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const meetingId = parseInt(id as string);

  if (isNaN(meetingId)) {
    return res.status(400).json({ error: 'ID non valido' });
  }

  try {
    if (req.method === 'GET') {
      // Recupera tutte le recensioni approvate e visibili
      const reviews = await prisma.quickMeetingReview.findMany({
        where: {
          quickMeetingId: meetingId,
          isApproved: true,
          isVisible: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          title: true,
          rating: true,
          reviewText: true,
          createdAt: true,
          user: {
            select: {
              nome: true
            }
          }
        }
      });

      return res.status(200).json({ reviews });
    }

    if (req.method === 'POST') {
      // Verifica autenticazione
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Devi essere autenticato per lasciare una recensione' });
      }

      const token = authHeader.substring(7);
      let userId: number;
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        userId = decoded.userId;
      } catch (err) {
        return res.status(401).json({ error: 'Sessione non valida' });
      }

      // Crea una nuova recensione
      const { title, rating, reviewText } = req.body;

      // Validazione
      if (!title || title.trim().length < 3) {
        return res.status(400).json({ error: 'Titolo richiesto (minimo 3 caratteri)' });
      }

      if (title.trim().length > 100) {
        return res.status(400).json({ error: 'Titolo troppo lungo (massimo 100 caratteri)' });
      }

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Valutazione richiesta (1-5 stelle)' });
      }

      if (!reviewText || reviewText.trim().length < 10) {
        return res.status(400).json({ error: 'Recensione richiesta (minimo 10 caratteri)' });
      }

      if (reviewText.trim().length > 1000) {
        return res.status(400).json({ error: 'Recensione troppo lunga (massimo 1000 caratteri)' });
      }

      // Verifica che l'incontro esista
      const meeting = await prisma.quickMeeting.findUnique({
        where: { id: meetingId }
      });

      if (!meeting) {
        return res.status(404).json({ error: 'Incontro non trovato' });
      }

      // Crea la recensione (in attesa di approvazione)
      const review = await prisma.quickMeetingReview.create({
        data: {
          quickMeetingId: meetingId,
          userId: userId,
          title: title.trim(),
          rating: parseInt(rating),
          reviewText: reviewText.trim(),
          isApproved: false, // Richiede approvazione
          isVisible: true
        }
      });

      return res.status(201).json({ 
        success: true, 
        message: 'Recensione inviata con successo! Sarà visibile dopo l\'approvazione.',
        review: {
          id: review.id,
          title: review.title,
          rating: review.rating,
          reviewText: review.reviewText,
          createdAt: review.createdAt
        }
      });
    }

    return res.status(405).json({ error: 'Metodo non consentito' });
  } catch (error) {
    console.error('Errore API recensioni:', error);
    return res.status(500).json({ error: 'Errore del server' });
  } finally {
    await prisma.$disconnect();
  }
}
