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
      let s = await prisma.adminSettings.findFirst()
      if (!s) s = await prisma.adminSettings.create({ data: {} })
      return res.json({ settings: s })
    }

    if (req.method === 'PATCH') {
      const body = req.body || {}
      const creditValueCents = Number(body?.creditValueCents)
      const currency = typeof body?.currency === 'string' ? body.currency : undefined
      const placementPricePerDayCredits = Number(body?.placementPricePerDayCredits)
      const placementMinDays = Number(body?.placementMinDays)
      const placementMaxDays = Number(body?.placementMaxDays)

      let s = await prisma.adminSettings.findFirst()
      if (!s) s = await prisma.adminSettings.create({ data: {} })

      const updated = await prisma.adminSettings.update({
        where: { id: s.id },
        data: {
          creditValueCents: Number.isFinite(creditValueCents) && creditValueCents > 0 ? creditValueCents : undefined,
          currency,
          placementPricePerDayCredits: Number.isFinite(placementPricePerDayCredits) && placementPricePerDayCredits > 0 ? placementPricePerDayCredits : undefined,
          placementMinDays: Number.isFinite(placementMinDays) && placementMinDays > 0 ? placementMinDays : undefined,
          placementMaxDays: Number.isFinite(placementMaxDays) && placementMaxDays >= (Number.isFinite(placementMinDays) ? placementMinDays : 1) ? placementMaxDays : undefined,
        }
      })
      return res.json({ settings: updated })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    return res.status(500).json({ error: 'Errore interno' })
  }
}
