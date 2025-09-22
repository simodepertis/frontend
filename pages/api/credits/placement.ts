import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Non autenticato' })
    const payload = verifyToken(token)
    if (!payload) return res.status(401).json({ error: 'Token non valido' })

    const { action } = (req.body || {}) as { action?: 'pause' | 'resume' }
    if (!action || !['pause','resume'].includes(action)) {
      return res.status(400).json({ error: 'Azione non valida' })
    }

    const msPerDay = 24 * 60 * 60 * 1000
    const now = new Date()

    // Ensure profile exists
    const prof = await prisma.escortProfile.upsert({
      where: { userId: payload.userId },
      update: {},
      create: { userId: payload.userId },
    }) as any

    const contacts: any = prof.contacts || {}
    const placement = contacts.placement || null

    if (!placement) {
      return res.status(400).json({ error: 'Nessun posizionamento attivo da gestire' })
    }

    if (action === 'pause') {
      if (placement.status === 'ACTIVE') {
        const lastStartAt = new Date(placement.lastStartAt || placement.startedAt || now.toISOString())
        const elapsedDays = Math.max(0, Math.floor((now.getTime() - lastStartAt.getTime()) / msPerDay))
        const remainingDays = Math.max(0, Number(placement.remainingDays || 0) - elapsedDays)
        contacts.placement = {
          ...placement,
          status: 'PAUSED',
          remainingDays,
          lastPauseAt: now.toISOString(),
        }
        // Aggiorna tierExpiresAt a null per indicare pausa effettiva
        await prisma.escortProfile.update({ where: { userId: payload.userId }, data: { contacts, tierExpiresAt: null } })
        return res.json({ ok: true, placement: (contacts as any).placement })
      } // se non ACTIVE, lascia invariato
    } else if (action === 'resume') {
      const remaining = Number(placement.remainingDays || 0)
      if (remaining <= 0) {
        return res.status(400).json({ error: 'Nessun giorno residuo da utilizzare' })
      }
      contacts.placement = {
        ...placement,
        status: 'ACTIVE',
        lastStartAt: now.toISOString(),
      }
      const newExpires = new Date(now.getTime() + remaining * msPerDay)
      await prisma.escortProfile.update({ where: { userId: payload.userId }, data: { contacts, tierExpiresAt: newExpires } })
      return res.json({ ok: true, placement: (contacts as any).placement })
    }
    const updated = await prisma.escortProfile.update({ where: { userId: payload.userId }, data: { contacts } })
    return res.json({ ok: true, placement: (contacts as any).placement, profile: { userId: updated.userId } })
  } catch (e) {
    return res.status(500).json({ error: 'Errore interno' })
  }
}
