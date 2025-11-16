import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function addDays(date: Date, days: number) { const d = new Date(date); d.setDate(d.getDate()+days); return d }
function setHour(date: Date, h: number) { const d = new Date(date); d.setHours(h,0,0,0); return d }
function randomMinuteOffset() { return Math.floor(Math.random() * 60) * 60 * 1000 }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Non autenticato' })
    const payload = verifyToken(token)
    if (!payload) return res.status(401).json({ error: 'Token non valido' })

    const { meetingId, slots, days } = req.body || {}
    const mid = Number(meetingId)
    if (!mid) return res.status(400).json({ error: 'meetingId mancante' })

    const now = new Date()

    // Trova l'ultimo acquisto attivo per questo meeting e utente
    const purchase = await prisma.quickMeetingPurchase.findFirst({
      where: {
        userId: payload.userId,
        meetingId: mid,
        status: 'ACTIVE',
        expiresAt: { gt: now }
      },
      orderBy: { createdAt: 'desc' },
      include: { product: true }
    })

    if (!purchase) return res.status(400).json({ error: 'Nessun pacchetto attivo per questo annuncio' })

    const product = purchase.product

    const schedules: { runAt: Date; window: 'DAY' | 'NIGHT' | string }[] = []

    // helper per key data YYYY-MM-DD
    const dateKey = (d: Date) => d.toISOString().slice(0, 10)

    const hasDays = Array.isArray(days) && days.length > 0

    if (hasDays) {
      // days viene usato come template: la fascia scelta su un solo giorno viene applicata a tutti i giorni del pacchetto
      const templateHours: number[] = []
      for (const entry of days as any[]) {
        if (!entry) continue
        if (!Array.isArray(entry.slots)) continue
        for (const s of entry.slots) {
          const n = Number(s)
          if (Number.isFinite(n) && n >= 0 && n <= 23) templateHours.push(n)
        }
      }

      if (templateHours.length === 0) {
        // se non ci sono ore valide in days, mantieni il vecchio comportamento basato su mappa per giorno
        const dayMap = new Map<string, number[]>()
        for (const entry of days as any[]) {
          if (!entry || typeof entry.date !== 'string') continue
          const key = entry.date
          const raw: number[] = Array.isArray(entry.slots)
            ? entry.slots
                .map((s: any) => Number(s))
                .filter((n: number) => Number.isFinite(n) && n >= 0 && n <= 23)
            : []
          dayMap.set(key, raw)
        }

        for (let d = 0; d < product.durationDays; d++) {
          const baseDay = addDays(purchase.startedAt, d)
          const key = dateKey(baseDay)
          const rawSlotsForDay = dayMap.get(key) || []

          if (product.type === 'DAY') {
            let hour = 10
            const daySlots = rawSlotsForDay.filter((h) => h >= 8 && h <= 23).sort((a, b) => a - b)
            if (daySlots.length > 0) hour = daySlots[0]
            const baseRun = setHour(baseDay, hour)
            const runAt = new Date(baseRun.getTime() + randomMinuteOffset())
            schedules.push({ window: 'DAY', runAt })
          } else {
            const nightSlots = rawSlotsForDay
              .filter((h) => (h >= 22 && h <= 23) || (h >= 0 && h <= 7))
              .sort((a, b) => a - b)

            if (nightSlots.length === 0) {
              for (let i = 0; i < product.quantityPerWindow; i++) {
                const base = setHour(baseDay, 22)
                const runAt = new Date(base.getTime() + i * 45 * 60 * 1000 + randomMinuteOffset())
                schedules.push({ window: 'NIGHT', runAt })
              }
            } else {
              const maxPerNight = product.quantityPerWindow
              for (let i = 0; i < maxPerNight; i++) {
                const slotIndex = i % nightSlots.length
                const hour = nightSlots[slotIndex]
                const targetDate = hour >= 22 ? baseDay : addDays(baseDay, 1)
                const baseRun = setHour(targetDate, hour)
                const runAt = new Date(baseRun.getTime() + randomMinuteOffset())
                schedules.push({ window: 'NIGHT', runAt })
              }
            }
          }
        }
      } else {
        if (product.type === 'DAY') {
          // DAY: unica ora template 08-23, random minuti dentro l'ora, per ogni giorno
          let templateHour = 10
          const dayTemplate = templateHours
            .filter((h) => h >= 8 && h <= 23)
            .sort((a, b) => a - b)
          if (dayTemplate.length > 0) templateHour = dayTemplate[0]

          for (let d = 0; d < product.durationDays; d++) {
            const baseDay = addDays(purchase.startedAt, d)
            const baseRun = setHour(baseDay, templateHour)
            const runAt = new Date(baseRun.getTime() + randomMinuteOffset())
            schedules.push({ window: 'DAY', runAt })
          }
        } else {
          // NIGHT: usa ore notturne template per ogni notte, con minuti casuali
          const nightTemplate = templateHours
            .filter((h) => (h >= 22 && h <= 23) || (h >= 0 && h <= 7))
            .sort((a, b) => a - b)

          for (let d = 0; d < product.durationDays; d++) {
            const baseDay = addDays(purchase.startedAt, d)

            if (nightTemplate.length === 0) {
              for (let i = 0; i < product.quantityPerWindow; i++) {
                const base = setHour(baseDay, 22)
                const runAt = new Date(base.getTime() + i * 45 * 60 * 1000 + randomMinuteOffset())
                schedules.push({ window: 'NIGHT', runAt })
              }
            } else {
              const maxPerNight = product.quantityPerWindow
              for (let i = 0; i < maxPerNight; i++) {
                const slotIndex = i % nightTemplate.length
                const hour = nightTemplate[slotIndex]
                const targetDate = hour >= 22 ? baseDay : addDays(baseDay, 1)
                const baseRun = setHour(targetDate, hour)
                const runAt = new Date(baseRun.getTime() + randomMinuteOffset())
                schedules.push({ window: 'NIGHT', runAt })
              }
            }
          }
        }
      }
    } else {
      // compatibilità: vecchia logica basata su slots[] globali
      // normalizza slots: array di ore intere 0-23
      const rawSlots: number[] = Array.isArray(slots)
        ? slots.map((s: any) => Number(s)).filter((n) => Number.isFinite(n) && n >= 0 && n <= 23)
        : []

      for (let d = 0; d < product.durationDays; d++) {
        if (product.type === 'DAY') {
          let hour = 10
          const daySlots = rawSlots.filter((h) => h >= 8 && h <= 23).sort((a, b) => a - b)
          if (daySlots.length > 0) hour = daySlots[0]
          const baseRun = setHour(addDays(purchase.startedAt, d), hour)
          const runAt = new Date(baseRun.getTime() + randomMinuteOffset())
          schedules.push({ window: 'DAY', runAt })
        } else {
          const nightSlots = rawSlots
            .filter((h) => (h >= 22 && h <= 23) || (h >= 0 && h <= 7))
            .sort((a, b) => a - b)

          if (nightSlots.length === 0) {
            for (let i = 0; i < product.quantityPerWindow; i++) {
              const base = setHour(addDays(purchase.startedAt, d), 22)
              const runAt = new Date(base.getTime() + i * 45 * 60 * 1000 + randomMinuteOffset())
              schedules.push({ window: 'NIGHT', runAt })
            }
          } else {
            const maxPerNight = product.quantityPerWindow
            for (let i = 0; i < maxPerNight; i++) {
              const slotIndex = i % nightSlots.length
              const hour = nightSlots[slotIndex]
              const targetDate = hour >= 22 ? addDays(purchase.startedAt, d) : addDays(purchase.startedAt, d + 1)
              const baseRun = setHour(targetDate, hour)
              const runAt = new Date(baseRun.getTime() + randomMinuteOffset())
              schedules.push({ window: 'NIGHT', runAt })
            }
          }
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      // Elimina solo gli schedule futuri ancora PENDING
      await tx.quickMeetingBumpSchedule.deleteMany({
        where: {
          purchaseId: purchase.id,
          status: 'PENDING',
          runAt: { gt: now }
        }
      })

      if (schedules.length) {
        await tx.quickMeetingBumpSchedule.createMany({
          data: schedules.map((s) => ({
            purchaseId: purchase.id,
            window: s.window,
            runAt: s.runAt
          }))
        })
      }
    })

    return res.json({ ok: true })
  } catch (e) {
    console.error('update-schedule error', e)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
