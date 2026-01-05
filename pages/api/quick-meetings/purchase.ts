import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function addDays(date: Date, days: number) { const d = new Date(date); d.setDate(d.getDate()+days); return d }
function setHour(date: Date, h: number) { const d = new Date(date); d.setHours(h,0,0,0); return d }
// offset casuale di minuti all'interno dell'ora (0-59 minuti)
function randomMinuteOffsetWithinHour() { return Math.floor(Math.random() * 60) * 60 * 1000 }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Non autenticato' })
    const payload = verifyToken(token)
    if (!payload) return res.status(401).json({ error: 'Token non valido' })

    const { meetingId, code, slots, days } = req.body || {}
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
    const codeStr = String(product.code)
    const isSuperTop = codeStr === 'SUPERTOP' || codeStr.startsWith('SUPERTOP_')
    // Per i pacchetti normali (DAY/NIGHT) il primo giorno utile è il giorno successivo all'acquisto
    const scheduleStart = product.code === 'IMMEDIATE' || isSuperTop ? now : addDays(now, 1)
    const expires = addDays(scheduleStart, product.durationDays)

    const result = await prisma.$transaction(async (tx) => {
      // Deduct credits
      const updatedWallet = await tx.creditWallet.update({ where: { userId: payload.userId }, data: { balance: { decrement: product!.creditsCost } } })
      await tx.creditTransaction.create({ data: { userId: payload.userId, amount: -product!.creditsCost, type: 'SPEND', reference: `QM_${product!.code}` } })

      // Create purchase
      const purchase = await tx.quickMeetingPurchase.create({
        data: {
          userId: payload.userId,
          meetingId: mid,
          productId: product!.id,
          status: 'ACTIVE',
          startedAt: scheduleStart,
          expiresAt: expires
        }
      })

      // Create schedules distribuite sulle fasce orarie selezionate (se presenti)
      const schedules: any[] = []

      // normalizza slots: array di ore intere 0-23
      const rawSlots: number[] = Array.isArray(slots)
        ? slots.map((s: any) => Number(s)).filter((n) => Number.isFinite(n) && n >= 0 && n <= 23)
        : []

      const hasDays = Array.isArray(days) && days.length > 0

      if (product.code === 'IMMEDIATE') {
        // Pacchetto speciale: una sola risalita immediata
        const runAt = now
        schedules.push({ purchaseId: purchase.id, window: 'DAY', runAt })
      } else if (isSuperTop) {
        // SuperTop: nessuna schedule, l'annuncio viene fissato in alto per la durata del pacchetto
        await tx.quickMeeting.update({
          where: { id: mid },
          data: { bumpPackage: isSuperTop ? 'SUPERTOP' : null }
        })
      } else {
        if (hasDays) {
          // days contiene la fascia scelta sull'unico giorno mostrato al momento dell'acquisto
          // usiamo quella fascia come template per tutti i giorni del pacchetto
          const allTemplateHours: number[] = []
          for (const entry of days as any[]) {
            if (!entry) continue
            if (!Array.isArray(entry.slots)) continue
            for (const s of entry.slots) {
              const n = Number(s)
              if (Number.isFinite(n) && n >= 0 && n <= 23) allTemplateHours.push(n)
            }
          }

          if (allTemplateHours.length === 0) {
            // se per qualche motivo non ci sono ore valide, fallback al comportamento precedente basato su slots
          } else {
            if (product!.type === 'DAY') {
              // DAY: prendi una sola ora valida (08-23) come riferimento
              let templateHour = 10
              const dayTemplate = allTemplateHours
                .filter((h) => h >= 8 && h <= 23)
                .sort((a, b) => a - b)
              if (dayTemplate.length > 0) templateHour = dayTemplate[0]

              for (let d = 0; d < product!.durationDays; d++) {
                const baseDay = addDays(scheduleStart, d)
                const baseRun = setHour(baseDay, templateHour)
                const runAt = new Date(baseRun.getTime() + randomMinuteOffsetWithinHour())
                schedules.push({ purchaseId: purchase.id, window: 'DAY', runAt })
              }
            } else {
              // NIGHT: usa le ore notturne scelte come template per tutte le notti
              const nightTemplate = allTemplateHours
                .filter((h) => (h >= 22 && h <= 23) || (h >= 0 && h <= 7))
                .sort((a, b) => a - b)

              for (let d = 0; d < product!.durationDays; d++) {
                const baseDay = addDays(scheduleStart, d)

                if (nightTemplate.length === 0) {
                  // fallback: stessa logica automatica di prima
                  for (let i = 0; i < product!.quantityPerWindow; i++) {
                    const base = setHour(baseDay, 22)
                    const runAt = new Date(base.getTime() + (i * 45 * 60 * 1000) + randomMinuteOffsetWithinHour())
                    schedules.push({ purchaseId: purchase.id, window: 'NIGHT', runAt })
                  }
                } else {
                  const maxPerNight = product!.quantityPerWindow
                  for (let i = 0; i < maxPerNight; i++) {
                    const slotIndex = i % nightTemplate.length
                    const hour = nightTemplate[slotIndex]
                    const targetDate = hour >= 22 ? baseDay : addDays(baseDay, 1)
                    const baseRun = setHour(targetDate, hour)
                    const runAt = new Date(baseRun.getTime() + randomMinuteOffsetWithinHour())
                    schedules.push({ purchaseId: purchase.id, window: 'NIGHT', runAt })
                  }
                }
              }
            }
          }
        } else {
          for (let d = 0; d < product!.durationDays; d++) {
            if (product!.type === 'DAY') {
              let hour = 10
              const daySlots = rawSlots.filter(h => h >= 8 && h <= 23).sort((a, b) => a - b)
              if (daySlots.length > 0) hour = daySlots[0]
              const runAt = setHour(addDays(scheduleStart, d), hour)
              schedules.push({ purchaseId: purchase.id, window: 'DAY', runAt })
            } else {
              // NOTTE: ignora gli eventuali slots e genera risalite completamente casuali
              // nella fascia 00:00-07:59:59 per ogni notte del pacchetto
              const baseNight = setHour(addDays(scheduleStart, d), 0) // mezzanotte del giorno d
              const nightWindowMs = 8 * 60 * 60 * 1000 // 8 ore fino alle 08:00 escluse
              const maxPerNight = product!.quantityPerWindow
              for (let i = 0; i < maxPerNight; i++) {
                const offset = Math.floor(Math.random() * nightWindowMs)
                const runAt = new Date(baseNight.getTime() + offset)
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
