import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'ID richiesto' })
  }

  const meetingId = parseInt(id)
  if (isNaN(meetingId)) {
    return res.status(400).json({ error: 'ID non valido' })
  }

  try {
    // Incrementa il contatore delle visualizzazioni
    await prisma.quickMeeting.update({
      where: { id: meetingId },
      data: {
        views: {
          increment: 1
        }
      }
    })

    return res.json({ success: true })
  } catch (error) {
    console.error('Errore incremento visualizzazioni:', error)
    return res.status(500).json({ error: 'Errore interno del server' })
  }
}
