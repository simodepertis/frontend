import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

async function requireAdmin(req: NextApiRequest) {
  const auth = req.headers.authorization || ''
  const raw = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!raw) return null
  const payload = verifyToken(raw)
  if (!payload) return null
  const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { ruolo: true, email: true } })
  if (!user) return null
  // Admin role only
  if (user.ruolo !== 'admin') return null
  return payload
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req)
  if (!admin) return res.status(403).json({ error: 'Accesso negato' })

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Fetch photos having legacy URL prefix '/uploads/'
    const legacy = await prisma.photo.findMany({
      where: { url: { startsWith: '/uploads/' } },
      select: { id: true, url: true },
      take: 5000,
    })

    let updated = 0
    for (const p of legacy) {
      const fname = p.url.replace(/^\/uploads\//, '')
      const newUrl = `/api/uploads/${fname}`
      await prisma.photo.update({ where: { id: p.id }, data: { url: newUrl } })
      updated++
    }

    return res.json({ ok: true, scanned: legacy.length, updated })
  } catch (e) {
    console.error('❌ Migrazione URL foto fallita:', e)
    return res.status(500).json({ error: 'Errore migrazione' })
  }
}
