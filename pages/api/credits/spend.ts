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

    const body = req.body || {}
    const code = String(body?.code || '').trim()
    if (!code) return res.status(400).json({ error: 'Codice prodotto mancante' })

    const product = await prisma.creditProduct.findUnique({ where: { code } })
    if (!product || !product.active) return res.status(400).json({ error: 'Prodotto non valido' })

    // Ensure wallet
    let wallet = await prisma.creditWallet.findUnique({ where: { userId: payload.userId } })
    if (!wallet) wallet = await prisma.creditWallet.create({ data: { userId: payload.userId, balance: 0 } })

    if (wallet.balance < product.creditsCost) {
      return res.status(402).json({ error: 'Crediti insufficienti' })
    }

    const tier = mapProductToTier(product.code)
    const now = new Date()
    const msPerDay = 24 * 60 * 60 * 1000
    const expires = new Date(now.getTime() + product.durationDays * msPerDay)

    const result = await prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.creditWallet.update({
        where: { userId: payload.userId },
        data: { balance: { decrement: product.creditsCost } },
      })
      await tx.creditTransaction.create({ data: { userId: payload.userId, amount: -product.creditsCost, type: 'SPEND', reference: product.code } })

      // Se è un posizionamento a giorni (POS_*), gestiamo stato pausa/ripresa in contacts JSON
      if (product.code.startsWith('POS_')) {
        const prof = await tx.escortProfile.upsert({
          where: { userId: payload.userId },
          update: { tier: 'ARGENTO', tierExpiresAt: expires },
          create: { userId: payload.userId, tier: 'ARGENTO', tierExpiresAt: expires },
        })
        // Aggiorna campo contacts come JSON con stato placement
        const contacts: any = (prof as any).contacts || {}
        contacts.placement = {
          code: product.code,
          status: 'ACTIVE',
          startedAt: now.toISOString(),
          lastStartAt: now.toISOString(),
          remainingDays: product.durationDays,
        }
        await tx.escortProfile.update({ where: { userId: payload.userId }, data: { contacts } })
      } else if (product.code.startsWith('GIRL_')) {
        // Ragazza del Giorno: attiva badge per il giorno corrente
        const today = new Date()
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        await tx.escortProfile.upsert({
          where: { userId: payload.userId },
          update: { girlOfTheDayDate: startOfDay },
          create: { userId: payload.userId, girlOfTheDayDate: startOfDay },
        })
      } else {
        await tx.escortProfile.upsert({
          where: { userId: payload.userId },
          update: { tier, tierExpiresAt: expires },
          create: { userId: payload.userId, tier, tierExpiresAt: expires },
        })
      }
      return updatedWallet
    })

    return res.json({ ok: true, wallet: { balance: result.balance }, activated: { tier, expiresAt: expires.toISOString(), code: product.code } })
  } catch (e) {
    return res.status(500).json({ error: 'Errore interno' })
  }
}
