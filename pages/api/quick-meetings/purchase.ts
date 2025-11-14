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

    const { meetingId, code, slots } = req.body || {}
    const mid = Number(meetingId)
    if (!mid || !code) return res.status(400).json({ error: 'Parametri mancanti' })

    const meeting = await prisma.quickMeeting.findUnique({ where: { id: mid } })
    if (!meeting) return res.status(404).json({ error: 'Incontro non trovato' })
    if (meeting.userId && meeting.userId !== payload.userId) return res.status(403).json({ error: 'Non autorizzato' })

    let product = await prisma.quickMeetingProduct.findFirst({ where: { code: String(code), active: true } })

    // Se il prodotto non esiste ed è il pacchetto di risalita immediata, crealo al volo
    if (!product && String(code) === 'IMMEDIATE') {
      product = await prisma.quickMeetingProduct.create({
        data: {
          code: 'IMMEDIATE',
          label: 'Risalita immediata (1 bump)',
          type: 'DAY',
          quantityPerWindow: 1,
          durationDays: 1,
          creditsCost: 10,
          active: true
        }
      })
    }

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

      // Create schedules distribuite sulle fasce orarie selezionate (se presenti)
      const schedules: any[] = []

      // normalizza slots: array di ore intere 0-23
      const rawSlots: number[] = Array.isArray(slots)
        ? slots.map((s: any) => Number(s)).filter((n) => Number.isFinite(n) && n >= 0 && n <= 23)
        : []

      if (product.code === 'IMMEDIATE') {
        // Pacchetto speciale: una sola risalita immediata
        const runAt = now
        schedules.push({ purchaseId: purchase.id, window: 'DAY', runAt })
      } else {
        for (let d = 0; d < product!.durationDays; d++) {
          if (product!.type === 'DAY') {
            // DAY: 1 risalita al giorno. Se l'utente ha scelto una fascia valida (08-21) usiamo quella, altrimenti fallback 10:00
            let hour = 10
            const daySlots = rawSlots.filter(h => h >= 8 && h <= 21).sort((a, b) => a - b)
            if (daySlots.length > 0) hour = daySlots[0]
            const runAt = setHour(addDays(now, d), hour)
            schedules.push({ purchaseId: purchase.id, window: 'DAY', runAt })
          } else {
            // NIGHT: fino a quantityPerWindow risalite per "notte" su fascia 22:00-08:00
            const nightSlots = rawSlots.filter(h => (h >= 22 && h <= 23) || (h >= 0 && h <= 7)).sort((a, b) => a - b)

            if (nightSlots.length === 0) {
              // Fallback: mantieni distribuzione automatica come prima (22:00 -> ogni 45 minuti)
              for (let i = 0; i < product!.quantityPerWindow; i++) {
                const base = setHour(addDays(now, d), 22)
                const runAt = new Date(base.getTime() + (i * 45 * 60 * 1000))
                schedules.push({ purchaseId: purchase.id, window: 'NIGHT', runAt })
              }
            } else {
              // Distribuisci le risalite sulle fasce selezionate, ripetendo il ciclo se servono più slot
              const maxPerNight = product!.quantityPerWindow
              for (let i = 0; i < maxPerNight; i++) {
                const slotIndex = i % nightSlots.length
                const hour = nightSlots[slotIndex]
                // Per ore 22-23 usiamo il giorno corrente, per 0-7 il giorno successivo (stessa "notte")
                const targetDate = hour >= 22 ? addDays(now, d) : addDays(now, d + 1)
                const runAt = setHour(targetDate, hour)
                schedules.push({ purchaseId: purchase.id, window: 'NIGHT', runAt })
              }
            }
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
