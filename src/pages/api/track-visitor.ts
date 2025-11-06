import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo non consentito' })

  try {
    const { type, targetId, sessionId } = req.body

    if (!type || !targetId || !sessionId) {
      return res.status(400).json({ error: 'Parametri mancanti' })
    }

    // Controlla se questo sessionId ha già visitato questo target
    const existing = await prisma.visitor.findFirst({
      where: {
        sessionId,
        targetType: type,
        targetId: String(targetId)
      }
    })

    if (!existing) {
      // Nuovo visitatore unico, crea record
      await prisma.visitor.create({
        data: {
          sessionId,
          targetType: type,
          targetId: String(targetId)
        }
      })

      // Incrementa counter solo per visitatori unici
      if (type === 'quickMeeting') {
        await prisma.quickMeeting.update({
          where: { id: parseInt(targetId) },
          data: { views: { increment: 1 } }
        })
      } else if (type === 'escortProfile') {
        await prisma.user.update({
          where: { id: parseInt(targetId) },
          data: { profileViews: { increment: 1 } }
        })
      }
    }

    // Conta visitatori unici totali
    const uniqueVisitors = await prisma.visitor.count({
      where: {
        targetType: type,
        targetId: String(targetId)
      }
    })

    return res.status(200).json({ success: true, uniqueVisitors })
  } catch (error) {
    console.error('Errore track visitor:', error)
    return res.status(500).json({ error: 'Errore del server' })
  }
}
