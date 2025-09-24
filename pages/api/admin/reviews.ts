import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

async function requireAdmin(req: NextApiRequest) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null
  const u = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!u) return null
  if (u.ruolo === 'admin') return payload
  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const adm = await requireAdmin(req)
    if (!adm) return res.status(403).json({ error: 'Non autorizzato' })

    if (req.method === 'GET') {
      const items = await prisma.review.findMany({
        where: { status: 'IN_REVIEW' as any },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          id: true,
          rating: true,
          title: true,
          body: true,
          createdAt: true,
          author: { select: { id: true, nome: true, email: true } },
          target: { select: { id: true, nome: true, slug: true } },
        }
      })
      return res.json({ items })
    }

    if (req.method === 'PATCH') {
      const { id, action } = (req.body || {}) as { id?: number|string, action?: 'APPROVE'|'REJECT' }
      const rid = Number(id)
      if (!rid || (action !== 'APPROVE' && action !== 'REJECT')) return res.status(400).json({ error: 'Parametri non validi' })
      const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED'
      const updated = await prisma.review.update({ where: { id: rid }, data: { status: status as any } })
      return res.json({ ok: true, review: { id: updated.id, status: updated.status } })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    console.error('❌ admin/reviews error', e)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
