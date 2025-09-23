import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    let s = await prisma.adminSettings.findFirst()
    if (!s) s = await prisma.adminSettings.create({ data: {} })
    return res.json({
      placement: {
        pricePerDayCredits: s.placementPricePerDayCredits,
        minDays: s.placementMinDays,
        maxDays: s.placementMaxDays,
      }
    })
  } catch (e) {
    return res.status(500).json({ error: 'Errore interno' })
  }
}
