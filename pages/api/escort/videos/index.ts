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

  if (req.method === 'GET') {
    const videos = await prisma.video.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } })
    return res.json({ videos })
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {}
    const vid = Number(id || 0)
    if (!vid) return res.status(400).json({ error: 'ID mancante' })
    const v = await prisma.video.findUnique({ where: { id: vid } })
    if (!v || v.userId !== user.id) return res.status(404).json({ error: 'Non trovato' })
    await prisma.video.delete({ where: { id: vid } })
    return res.json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
