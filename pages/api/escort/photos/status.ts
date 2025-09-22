import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

async function requireUser(req: NextApiRequest) {
  const raw = getTokenFromRequest(req as any)
  if (!raw) return null
  const payload = verifyToken(raw)
  if (!payload) return null
  const u = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!u) return null
  return { id: u.id }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireUser(req)
  if (!user) return res.status(401).json({ error: 'Non autenticato' })

  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' })

  const { id, action } = req.body || {}
  const pid = Number(id || 0)
  const act = String(action || '').toUpperCase()
  if (!pid || !['IN_REVIEW','DRAFT','in_review','draft'].includes(act)) return res.status(400).json({ error: 'Parametri non validi' })

  const photo = await prisma.photo.findUnique({ where: { id: pid } })
  if (!photo || photo.userId !== user.id) return res.status(404).json({ error: 'Non trovato' })

  // Map action to status enum used by schema
  const status = act.startsWith('IN_') ? 'IN_REVIEW' : 'DRAFT'
  const updated = await prisma.photo.update({ where: { id: pid }, data: { status: status as any } })

  return res.json({ ok: true, photo: updated })
}
