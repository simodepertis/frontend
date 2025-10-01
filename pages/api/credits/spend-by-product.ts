import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function mapProductToTier(code: string) {
  if (code.startsWith('VIP')) return 'VIP' as const
  if (code.startsWith('TITANIO')) return 'TITANIO' as const
  if (code.startsWith('ORO')) return 'ORO' as const
  if (code.startsWith('ARGENTO')) return 'ARGENTO' as const
  return 'STANDARD' as const
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Non autenticato' })
    const payload = verifyToken(token)
    if (!payload) return res.status(401).json({ error: 'Token non valido' })

    const { code, days } = req.body || {}
    if (!code) return res.status(400).json({ error: 'Codice pacchetto mancante' })
    const nDays = Number(days)
    if (!Number.isFinite(nDays) || nDays <= 0) return res.status(400).json({ error: 'Giorni non validi' })

    // Ricerca tollerante: prima codice esatto, poi per prefisso
    let product = await prisma.creditProduct.findFirst({ where: { code: String(code), active: true } })
    if (!product) {
      // Cerca per prefisso (es. "VIP" trova "VIP 7 giorni")
      const rows = await prisma.creditProduct.findMany({ where: { active: true } })
      product = rows.find(r => r.code?.toUpperCase()?.startsWith(String(code).toUpperCase())) ?? null
    }
    if (!product) return res.status(400).json({ error: 'Prodotto non valido' })

    if (product.pricePerDayCredits == null) {
      return res.status(400).json({ error: 'Questo prodotto non supporta durata variabile' })
    }
    const min = product.minDays ?? 1
    const max = product.maxDays ?? 60
    if (nDays < min || nDays > max) return res.status(400).json({ error: `Giorni fuori range (${min}-${max})` })

    const cost = product.pricePerDayCredits * nDays

    // Ensure wallet
    let wallet = await prisma.creditWallet.findUnique({ where: { userId: payload.userId } })
    if (!wallet) wallet = await prisma.creditWallet.create({ data: { userId: payload.userId, balance: 0 } })
    if (wallet.balance < cost) return res.status(402).json({ error: 'Crediti insufficienti' })

    const now = new Date()
    const msPerDay = 24 * 60 * 60 * 1000
    const expires = new Date(now.getTime() + nDays * msPerDay)

    const result = await prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.creditWallet.update({ where: { userId: payload.userId }, data: { balance: { decrement: cost } } })
      await tx.creditTransaction.create({ data: { userId: payload.userId, amount: -cost, type: 'SPEND', reference: `${product.code}_VAR`, meta: { days: nDays, pricePerDay: product.pricePerDayCredits } } })

      const tier = mapProductToTier(product.code)
      const prof = await tx.escortProfile.upsert({
        where: { userId: payload.userId },
        update: { tier: tier === 'STANDARD' ? 'ARGENTO' : tier, tierExpiresAt: expires },
        create: { userId: payload.userId, tier: tier === 'STANDARD' ? 'ARGENTO' : tier, tierExpiresAt: expires },
      }) as any

      const contacts: any = prof.contacts || {}
      contacts.placement = {
        code: product.code,
        status: 'ACTIVE',
        startedAt: now.toISOString(),
        lastStartAt: now.toISOString(),
        remainingDays: nDays,
        perDay: product.pricePerDayCredits,
      }
      await tx.escortProfile.update({ where: { userId: payload.userId }, data: { contacts } })

      return updatedWallet
    })

    return res.json({ ok: true, wallet: { balance: result.balance }, activated: { code: product.code, expiresAt: expires.toISOString(), days: nDays, cost } })
  } catch (e) {
    return res.status(500).json({ error: 'Errore interno' })
  }
}
