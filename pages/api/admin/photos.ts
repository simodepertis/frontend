import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

async function requireAdmin(req: NextApiRequest) {
  const auth = req.headers.authorization || ''
  const raw = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!raw) return null
  const payload = verifyToken(raw)
  if (!payload) return null
  const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { ruolo: true } })
  if (user?.ruolo !== 'admin') return null
  return payload
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req)
  if (!admin) return res.status(403).json({ error: 'Accesso negato' })

  try {
    if (req.method === 'GET') {
      const status = String(req.query.status || 'IN_REVIEW').toUpperCase()
      const photos = await prisma.photo.findMany({
        where: { status: status as any },
        include: { user: { select: { id: true, nome: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })
      const items = photos.map((p) => ({
        id: p.id,
        userId: p.userId,
        userName: p.user?.nome || `User ${p.userId}`,
        userEmail: p.user?.email || '',
        url: p.url,
        name: p.name,
        size: p.size,
        status: p.status,
        createdAt: p.createdAt.toISOString(),
      }))
      return res.json({ photos: items })
    }

    if (req.method === 'PATCH') {
      const { id, action } = req.body || {}
      const pid = Number(id || 0)
      const act = String(action || '').toLowerCase()
      if (!pid || !['approve','reject','in_review','draft'].includes(act)) {
        return res.status(400).json({ error: 'Parametri non validi' })
      }
      const statusMap: Record<string, any> = {
        approve: 'APPROVED',
        reject: 'REJECTED',
        in_review: 'IN_REVIEW',
        draft: 'DRAFT',
      }
      const updated = await prisma.photo.update({ where: { id: pid }, data: { status: statusMap[act] } })
      return res.json({ success: true, photo: updated })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    console.error('❌ API admin/photos error:', e)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
