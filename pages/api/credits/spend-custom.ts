import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Non autenticato' })
    const payload = verifyToken(token)
    if (!payload) return res.status(401).json({ error: 'Token non valido' })

    const body = req.body || {}
    const days = Number(body?.days)
    if (!Number.isFinite(days) || days <= 0) return res.status(400).json({ error: 'Giorni non validi' })

    // Load admin settings for price and bounds
    let s = await prisma.adminSettings.findFirst()
    if (!s) s = await prisma.adminSettings.create({ data: {} })
    const min = s.placementMinDays
    const max = s.placementMaxDays
    const perDay = s.placementPricePerDayCredits
    if (days < min || days > max) return res.status(400).json({ error: `Giorni fuori range (${min}-${max})` })

    const cost = perDay * days

    // Ensure wallet
    let wallet = await prisma.creditWallet.findUnique({ where: { userId: payload.userId } })
    if (!wallet) wallet = await prisma.creditWallet.create({ data: { userId: payload.userId, balance: 0 } })
    if (wallet.balance < cost) return res.status(402).json({ error: 'Crediti insufficienti' })

    const now = new Date()
    const msPerDay = 24 * 60 * 60 * 1000
    const expires = new Date(now.getTime() + days * msPerDay)

    const result = await prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.creditWallet.update({ where: { userId: payload.userId }, data: { balance: { decrement: cost } } })
      await tx.creditTransaction.create({ data: { userId: payload.userId, amount: -cost, type: 'SPEND', reference: `POS_CUSTOM_${days}D`, meta: { days, perDay } } })

      const prof = await tx.escortProfile.upsert({
        where: { userId: payload.userId },
        update: { tier: 'ARGENTO', tierExpiresAt: expires },
        create: { userId: payload.userId, tier: 'ARGENTO', tierExpiresAt: expires },
      }) as any

      const contacts: any = prof.contacts || {}
      contacts.placement = {
        code: `POS_CUSTOM_${days}D`,
        status: 'ACTIVE',
        startedAt: now.toISOString(),
        lastStartAt: now.toISOString(),
        remainingDays: days,
        perDay,
      }
      await tx.escortProfile.update({ where: { userId: payload.userId }, data: { contacts } })

      return updatedWallet
    })

    return res.json({ ok: true, wallet: { balance: result.balance }, activated: { code: `POS_CUSTOM_${days}D`, expiresAt: expires.toISOString(), days, cost } })
  } catch (e) {
    return res.status(500).json({ error: 'Errore interno' })
  }
}
