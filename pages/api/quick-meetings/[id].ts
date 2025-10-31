import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'ID richiesto' })
  }

  const meetingId = parseInt(id)
  if (isNaN(meetingId)) {
    return res.status(400).json({ error: 'ID non valido' })
  }

  if (req.method === 'GET') {
    try {
      const meeting = await prisma.quickMeeting.findFirst({
        where: {
          id: meetingId,
          isActive: true,
          expiresAt: {
            gt: new Date()
          }
        }
      })

      if (!meeting) {
        return res.status(404).json({ error: 'Incontro non trovato' })
      }

      return res.json({ meeting })
    } catch (error) {
      console.error('Errore recupero incontro:', error)
      return res.status(500).json({ error: 'Errore interno del server' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
