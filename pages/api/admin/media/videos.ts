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
  const whitelist = new Set(['admin@local', 'musicamagazine23@gmail.com'])
  if (u.ruolo === 'admin' || (u.email && whitelist.has(u.email))) return payload
  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const adm = await requireAdmin(req)
    if (!adm) return res.status(403).json({ error: 'Non autorizzato' })

    if (req.method === 'GET') {
      const status = String((req.query.status as string) || 'IN_REVIEW')
      const items = await prisma.video.findMany({
        where: { status: status as any },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })
      return res.json({ items })
    }

    if (req.method === 'PATCH') {
      const { id, action } = req.body || {}
      const videoId = Number(id || 0)
      const act = String(action || '').toLowerCase()
      if (!videoId || !['approve', 'reject'].includes(act)) {
        return res.status(400).json({ error: 'Parametri non validi' })
      }
      const newStatus = act === 'approve' ? 'APPROVED' : 'REJECTED'
      const item = await prisma.video.update({ where: { id: videoId }, data: { status: newStatus as any } })
      return res.json({ ok: true, item })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    console.error('❌ Errore API admin/media/videos:', e)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
