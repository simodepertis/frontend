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

      const { targetUserId, body } = req.body || {}
      const tid = Number(targetUserId)
      const text = String(body || '').trim()
      if (!tid || !text) return res.status(400).json({ error: 'Dati commento non validi' })

      const target = await prisma.user.findUnique({ where: { id: tid } })
      if (!target) return res.status(404).json({ error: 'Target non trovato' })

      const created = await prisma.comment.create({
        data: {
          authorId: payload.userId,
          targetUserId: tid,
          body: text,
          status: 'APPROVED',
        },
        include: { author: { select: { id: true, nome: true } } }
      })
      return res.json({ ok: true, comment: created })
    } catch (e) {
      console.error('comments POST error', e)
      return res.status(500).json({ error: 'Errore interno' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
