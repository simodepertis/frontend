import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Verifica admin
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ error: 'Token mancante' })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return res.status(401).json({ error: 'Token non valido' })
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { ruolo: true }
    })

    if (user?.ruolo !== 'admin') {
      return res.status(403).json({ error: 'Accesso negato' })
    }

    // Carica statistiche
    const [
      totalUsers,
      pendingPhotos,
      pendingVideos,
      pendingOrders,
      pendingProfiles,
      totalCreditsOrdered
    ] = await Promise.all([
      prisma.user.count(),
      prisma.photo.count({ where: { status: 'IN_REVIEW' } }),
      prisma.video.count({ where: { status: 'IN_REVIEW' } }),
      prisma.creditTransaction.count({ where: { status: 'PENDING' } }),
      prisma.escortProfile.count({ where: { consentAcceptedAt: { not: null } } }),
      prisma.creditTransaction.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED' }
      })
    ])

    const stats = {
      totalUsers,
      pendingPhotos,
      pendingVideos,
      pendingOrders,
      pendingProfiles,
      totalCreditsOrdered: totalCreditsOrdered._sum.amount || 0
    }

    console.log('✅ Admin stats caricate:', stats)
    return res.json({ stats })
  } catch (error: unknown) {
    console.error('❌ Errore API admin stats:', error)
    return res.status(500).json({ error: 'Errore interno del server' })
  }
}
