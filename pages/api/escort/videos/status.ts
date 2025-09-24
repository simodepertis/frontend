import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

async function requireUser(req: NextApiRequest) {
  const auth = req.headers.authorization || ''
  const raw = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!raw) return null
  const payload = verifyToken(raw)
  if (!payload) return null
  const u = await prisma.user.findUnique({ where: { id: payload.userId } })
  return u || null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireUser(req)
  if (!user) return res.status(401).json({ error: 'Non autenticato' })
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' })

  const { id, action } = req.body || {}
  const vid = Number(id || 0)
  const act = String(action || '').toUpperCase()
  if (!vid || !['IN_REVIEW','DRAFT','in_review','draft'].includes(act)) return res.status(400).json({ error: 'Parametri non validi' })

  const v = await prisma.video.findUnique({ where: { id: vid } })
  if (!v || v.userId !== user.id) return res.status(404).json({ error: 'Non trovato' })

  const status = act.startsWith('IN_') ? 'IN_REVIEW' : 'DRAFT'
  const updated = await prisma.video.update({ where: { id: vid }, data: { status: status as any } })
  return res.json({ ok: true, video: updated })
}
