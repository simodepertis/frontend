import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function currentWindow(): 'DAY' | 'NIGHT' {
  const h = new Date().getHours()
  return (h >= 22 || h < 6) ? 'NIGHT' : 'DAY'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Non autenticato' })
    const payload = verifyToken(token)
    if (!payload) return res.status(401).json({ error: 'Token non valido' })

    const { meetingId } = req.body || {}
    const mid = Number(meetingId)
    if (!mid) return res.status(400).json({ error: 'meetingId mancante' })

    const meeting = await prisma.quickMeeting.findUnique({ where: { id: mid } })
    if (!meeting) return res.status(404).json({ error: 'Incontro non trovato' })
    if (meeting.userId && meeting.userId !== payload.userId) return res.status(403).json({ error: 'Non autorizzato' })

    const win = currentWindow()

    // Trova uno schedule PENDING valido per questo meeting e utente
    const purchase = await prisma.quickMeetingPurchase.findFirst({
      where: {
        userId: payload.userId,
        meetingId: mid,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
        schedules: { some: { status: 'PENDING' } }
      },
      include: { schedules: { where: { status: 'PENDING' }, orderBy: { runAt: 'asc' }, take: 50 }, product: true }
    })
    if (!purchase) return res.status(400).json({ error: 'Nessuna risalita disponibile' })

    // pick schedule
    const sched = purchase.schedules.find(s => s.window === win) || purchase.schedules[0]
    if (!sched) return res.status(400).json({ error: 'Nessuna risalita disponibile' })

    const now = new Date()

    await prisma.$transaction(async (tx) => {
      await tx.quickMeeting.update({ where: { id: mid }, data: { publishedAt: now, lastBumpAt: now, bumpCount: { increment: 1 } } })
      await tx.bumpLog.create({ data: { quickMeetingId: mid, bumpedAt: now, timeSlot: win, success: true } })
      await tx.quickMeetingBumpSchedule.update({ where: { id: sched.id }, data: { status: 'DONE', executedAt: now } })
    })

    return res.json({ ok: true, bumpedAt: new Date().toISOString(), window: win })
  } catch (e) {
    console.error('bump-now error', e)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
