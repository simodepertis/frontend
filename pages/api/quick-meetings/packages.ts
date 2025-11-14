import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    // Seed defaults if empty
    const count = await prisma.quickMeetingProduct.count()
    if (count === 0) {
      const defaults = [
        { code: '1x1DAY', label: '1 risalita al giorno · 1 giorno', type: 'DAY', quantityPerWindow: 1, durationDays: 1, creditsCost: 50 },
        { code: '1x3DAY', label: '1 risalita al giorno · 3 giorni', type: 'DAY', quantityPerWindow: 1, durationDays: 3, creditsCost: 120 },
        { code: '1x7DAY', label: '1 risalita al giorno · 7 giorni', type: 'DAY', quantityPerWindow: 1, durationDays: 7, creditsCost: 220 },
        { code: '10x1NIGHT', label: '10 risalite/notte · 1 notte', type: 'NIGHT', quantityPerWindow: 10, durationDays: 1, creditsCost: 50 },
        { code: '10x3NIGHT', label: '10 risalite/notte · 3 notti', type: 'NIGHT', quantityPerWindow: 10, durationDays: 3, creditsCost: 120 },
        { code: '10x7NIGHT', label: '10 risalite/notte · 7 notti', type: 'NIGHT', quantityPerWindow: 10, durationDays: 7, creditsCost: 220 },
      ]
      for (const d of defaults) {
        await prisma.quickMeetingProduct.upsert({
          where: { code: d.code },
          create: { ...d, active: true },
          update: {},
        })
      }
    }

    // pacchetto speciale per risalita immediata (10 crediti)
    const immediate = {
      code: 'IMMEDIATE',
      label: 'Risalita immediata',
      type: 'DAY' as const,
      quantityPerWindow: 1,
      durationDays: 1,
      creditsCost: 10,
    }
    await prisma.quickMeetingProduct.upsert({
      where: { code: immediate.code },
      create: { ...immediate, active: true },
      update: { active: true, creditsCost: immediate.creditsCost },
    })

    const items = await prisma.quickMeetingProduct.findMany({
      where: { active: true },
      orderBy: [{ type: 'asc' }, { durationDays: 'asc' }],
      select: { id: true, code: true, label: true, type: true, quantityPerWindow: true, durationDays: true, creditsCost: true }
    })
    return res.status(200).json({ items })
  } catch (e) {
    return res.status(500).json({ error: 'Errore interno' })
  }
}
