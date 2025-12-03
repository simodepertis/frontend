import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Token mancante' })
    const decoded = verifyToken(token)
    if (!decoded) return res.status(401).json({ error: 'Token non valido' })

    const me = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { ruolo: true } })
    if (me?.ruolo !== 'admin') return res.status(403).json({ error: 'Accesso negato' })

    if (req.method === 'GET') {
      const userId = Number(req.query.userId)
      if (!userId || !Number.isFinite(userId)) return res.status(400).json({ error: 'userId mancante o non valido' })

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          nome: true,
          email: true,
          ruolo: true,
          createdAt: true,
          escortProfile: true,
          photos: { select: { id: true, url: true, status: true } },
          documents: { select: { id: true, status: true } },
        },
      })

      if (!user) return res.status(404).json({ error: 'Utente non trovato' })

      return res.json({ user })
    }

    if (req.method === 'PATCH') {
      const { userId, profile } = req.body || {}
      const uid = Number(userId)
      if (!uid || !Number.isFinite(uid)) return res.status(400).json({ error: 'userId mancante o non valido' })

      const { bioIt } = profile || {}

      const updated = await prisma.escortProfile.upsert({
        where: { userId: uid },
        update: {
          bioIt: bioIt ?? undefined,
        },
        create: {
          userId: uid,
          bioIt: bioIt ?? '',
        },
      })

      return res.json({ ok: true, profile: updated })
    }

    res.setHeader('Allow', 'GET, PATCH')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('❌ /api/admin/escort-profile error', error)
    return res.status(500).json({ error: 'Errore interno del server' })
  }
}
