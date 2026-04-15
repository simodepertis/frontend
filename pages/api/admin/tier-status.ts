import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  const decoded = token ? verifyToken(token) : null
  if (!decoded) return res.status(401).json({ error: 'Non autorizzato' })
  const me = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { ruolo: true } })
  if (me?.ruolo !== 'admin') return res.status(403).json({ error: 'Accesso negato' })

  const profiles = await prisma.escortProfile.findMany({
    where: { tier: { not: 'STANDARD' } },
    select: {
      userId: true,
      tier: true,
      tierExpiresAt: true,
      user: { select: { nome: true, email: true } },
    },
    orderBy: { tierExpiresAt: 'asc' },
  })

  const now = new Date()
  const result = profiles.map((p) => {
    const expiresAt = p.tierExpiresAt ? new Date(p.tierExpiresAt) : null
    const isExpired = !expiresAt || expiresAt <= now
    return {
      userId: p.userId,
      nome: p.user?.nome || '?',
      email: p.user?.email || '?',
      tier: p.tier,
      tierExpiresAt: p.tierExpiresAt,
      isExpired,
      displayedAs: isExpired ? 'STANDARD' : p.tier,
    }
  })

  return res.json({
    serverTime: now.toISOString(),
    total: result.length,
    expired: result.filter((r) => r.isExpired).length,
    active: result.filter((r) => !r.isExpired).length,
    profiles: result,
  })
}
