import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Non autenticato' })
    const payload = verifyToken(token)
    if (!payload) return res.status(401).json({ error: 'Token non valido' })

    const meetingId = Number(req.query.meetingId)
    if (!meetingId) return res.status(400).json({ error: 'meetingId mancante' })

    const now = new Date()

    // Trova l'ultimo acquisto attivo per questo meeting e utente
    const purchase = await prisma.quickMeetingPurchase.findFirst({
      where: {
        userId: payload.userId,
        meetingId,
        status: 'ACTIVE',
        expiresAt: { gt: now }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        product: true,
        schedules: {
          where: { runAt: { gt: now } },
          orderBy: { runAt: 'asc' }
        }
      }
    })

    if (!purchase) {
      return res.json({ purchase: null, schedules: [] })
    }

    return res.json({
      purchase: {
        id: purchase.id,
        productCode: purchase.product.code,
        productLabel: purchase.product.label,
        type: purchase.product.type,
        expiresAt: purchase.expiresAt,
        durationDays: purchase.product.durationDays,
        startedAt: purchase.startedAt
      },
      schedules: purchase.schedules.map((s) => ({
        id: s.id,
        runAt: s.runAt,
        status: s.status,
        window: s.window
      }))
    })
  } catch (e) {
    console.error('schedule error', e)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
