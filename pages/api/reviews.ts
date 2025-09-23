import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '')
      if (!token) return res.status(401).json({ error: 'Non autenticato' })
      const payload = verifyToken(token)
      if (!payload) return res.status(401).json({ error: 'Token non valido' })

      const { targetUserId, rating, title, body } = req.body || {}
      const tid = Number(targetUserId)
      const r = Number(rating)
      if (!tid || !Number.isFinite(r) || r < 1 || r > 5 || !String(title||'').trim() || !String(body||'').trim()) {
        return res.status(400).json({ error: 'Dati recensione non validi' })
      }

      // Ensure target exists
      const target = await prisma.user.findUnique({ where: { id: tid } })
      if (!target) return res.status(404).json({ error: 'Target non trovato' })

      const created = await prisma.review.create({
        data: {
          authorId: payload.userId,
          targetUserId: tid,
          rating: r,
          title: String(title),
          body: String(body),
          status: 'APPROVED', // auto-approve per ambiente dev
        },
        include: { author: { select: { id: true, nome: true } } }
      })
      return res.json({ ok: true, review: created })
    } catch (e) {
      console.error('reviews POST error', e)
      return res.status(500).json({ error: 'Errore interno' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
