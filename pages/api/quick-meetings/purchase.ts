import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function addDays(date: Date, days: number) { const d = new Date(date); d.setDate(d.getDate()+days); return d }
function setHour(date: Date, h: number) { const d = new Date(date); d.setHours(h,0,0,0); return d }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Non autenticato' })
    const payload = verifyToken(token)
    if (!payload) return res.status(401).json({ error: 'Token non valido' })

    const { meetingId, code } = req.body || {}
    const mid = Number(meetingId)
    if (!mid || !code) return res.status(400).json({ error: 'Parametri mancanti' })

    const meeting = await prisma.quickMeeting.findUnique({ where: { id: mid } })
    if (!meeting) return res.status(404).json({ error: 'Incontro non trovato' })
    if (meeting.userId && meeting.userId !== payload.userId) return res.status(403).json({ error: 'Non autorizzato' })

    let product = await prisma.quickMeetingProduct.findFirst({ where: { code: String(code), active: true } })
    if (!product) return res.status(400).json({ error: 'Prodotto non valido' })

    // Ensure wallet
    let wallet = await prisma.creditWallet.findUnique({ where: { userId: payload.userId } })
    if (!wallet) wallet = await prisma.creditWallet.create({ data: { userId: payload.userId, balance: 0 } })
    if (wallet.balance < product.creditsCost) return res.status(402).json({ error: 'Crediti insufficienti' })

    const now = new Date()
    const expires = addDays(now, product.durationDays)

    const result = await prisma.$transaction(async (tx) => {
      // Deduct credits
      const updatedWallet = await tx.creditWallet.update({ where: { userId: payload.userId }, data: { balance: { decrement: product!.creditsCost } } })
      await tx.creditTransaction.create({ data: { userId: payload.userId, amount: -product!.creditsCost, type: 'SPEND', reference: `QM_${product!.code}` } })

      // Create purchase
      const purchase = await tx.quickMeetingPurchase.create({ data: { userId: payload.userId, meetingId: mid, productId: product!.id, status: 'ACTIVE', startedAt: now, expiresAt: expires } })

      // Create schedules (simple distribution)
      const schedules: any[] = []
      for (let d = 0; d < product!.durationDays; d++) {
        if (product!.type === 'DAY') {
          const runAt = setHour(addDays(now, d), 10) // 10:00
          schedules.push({ purchaseId: purchase.id, window: 'DAY', runAt })
        } else {
          // NIGHT: 10 risalite a notte distribuite tra 22:00 e 05:00
          for (let i = 0; i < product!.quantityPerWindow; i++) {
            const base = setHour(addDays(now, d), 22)
            const runAt = new Date(base.getTime() + (i * 45 * 60 * 1000)) // ogni 45 minuti
            schedules.push({ purchaseId: purchase.id, window: 'NIGHT', runAt })
          }
        }
      }
      if (schedules.length) await tx.quickMeetingBumpSchedule.createMany({ data: schedules })

      return { wallet: updatedWallet, purchase }
    })

    return res.json({ ok: true, wallet: { balance: result.wallet.balance }, purchase: { id: result.purchase.id, expiresAt: result.purchase.expiresAt } })
  } catch (e) {
    console.error('purchase error', e)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
