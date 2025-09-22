import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

async function ensureDefaults() {
  const count = await prisma.creditProduct.count()
  if (count === 0) {
    await prisma.creditProduct.createMany({ data: [
      { code: 'VIP_7D', label: 'VIP 7 Giorni', creditsCost: 100, durationDays: 7, active: true },
      { code: 'TITANIO_30D', label: 'Titanio 30 Giorni', creditsCost: 150, durationDays: 30, active: true },
      { code: 'ORO_30D', label: 'Oro 30 Giorni', creditsCost: 80, durationDays: 30, active: true },
      { code: 'ARGENTO_30D', label: 'Argento 30 Giorni', creditsCost: 40, durationDays: 30, active: true },
    ]})
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    await ensureDefaults()
    const products = await prisma.creditProduct.findMany({ where: { active: true }, orderBy: { creditsCost: 'asc' } })
    return res.json({ products })
  } catch (e) {
    return res.status(500).json({ error: 'Errore interno' })
  }
}
