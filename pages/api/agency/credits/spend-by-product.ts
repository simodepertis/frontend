import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function parseTierFromCode(code: string): 'ARGENTO'|'ORO'|'TITANIO'|'VIP'|'STANDARD' {
  const c = code.toUpperCase()
  if (c.startsWith('VIP')) return 'VIP'
  if (c.startsWith('TITANIO')) return 'TITANIO'
  if (c.startsWith('ORO')) return 'ORO'
  if (c.startsWith('ARGENTO')) return 'ARGENTO'
  return 'STANDARD'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    const auth = req.headers.authorization || ''
    const raw = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7) : ''
    if (!raw) return res.status(401).json({ error: 'Non autenticato' })
    const payload = verifyToken(raw)
    if (!payload) return res.status(401).json({ error: 'Token non valido' })

    const { escortUserId, code, days } = req.body || {}
    const uid = Number(escortUserId || 0)
    const d = Number(days || 0)
    if (!uid || !code || !Number.isFinite(d) || d <= 0) return res.status(400).json({ error: 'Parametri mancanti' })

    const prof = await prisma.escortProfile.findUnique({ where: { userId: uid } })
    if (!prof || prof.agencyId !== payload.userId) return res.status(403).json({ error: 'Escort non collegata alla tua agenzia' })

    // Ricerca tollerante: prima codice esatto, poi per prefisso
    let product = await prisma.creditProduct.findFirst({ where: { code: String(code), active: true } })
    if (!product) {
      // Cerca per prefisso (es. "VIP" trova "VIP 7 giorni")
      const rows = await prisma.creditProduct.findMany({ where: { active: true } })
      product = rows.find(r => r.code?.toUpperCase()?.startsWith(String(code).toUpperCase())) ?? null
    }
    if (!product) return res.status(400).json({ error: 'Prodotto non valido' })

    const pAny = product as any
    if (!pAny.pricePerDayCredits) return res.status(400).json({ error: 'Prodotto non a consumo giornaliero' })
    const minD = (pAny.minDays ?? 1) as number
    const maxD = (pAny.maxDays ?? 60) as number
    if (d < minD || d > maxD) return res.status(400).json({ error: `Giorni fuori range (${minD}-${maxD})` })

    const cost = (pAny.pricePerDayCredits as number) * d

    // L'agenzia paga con i propri crediti (wallet dell'utente autenticato), non con quello dell'escort
    let wallet = await prisma.creditWallet.findUnique({ where: { userId: payload.userId } })
    if (!wallet) wallet = await prisma.creditWallet.create({ data: { userId: payload.userId, balance: 0 } })
    if (wallet.balance < cost) return res.status(400).json({ error: 'Crediti insufficienti' })

    const tier = parseTierFromCode(product.code)
    const expiresAt = new Date(Date.now() + d * 24 * 60 * 60 * 1000)

    const [updatedWallet] = await prisma.$transaction([
      prisma.creditWallet.update({ where: { id: wallet.id }, data: { balance: { decrement: cost } } }),
      prisma.escortProfile.update({ where: { userId: uid }, data: { tier, tierExpiresAt: expiresAt } }),
      prisma.creditTransaction.create({ data: { userId: payload.userId, amount: -cost, type: 'SPEND' as any, reference: `product:${product.code}:${d}d:escort:${uid}` } })
    ])

    return res.json({ ok: true, wallet: updatedWallet, activated: { tier, expiresAt } })
  } catch (e:any) {
    console.error('agency credits spend-by-product error', e)
    return res.status(500).json({ error: e?.message || 'Errore interno' })
  }
}
