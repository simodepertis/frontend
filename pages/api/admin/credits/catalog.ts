import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

const DEFAULTS = [
  { code: 'VIP',     label: 'VIP',     pricePerDayCredits: 110, minDays: 1, maxDays: 60 },
  { code: 'ORO',     label: 'ORO',     pricePerDayCredits: 90,  minDays: 1, maxDays: 60 },
  { code: 'ARGENTO', label: 'ARGENTO', pricePerDayCredits: 70,  minDays: 1, maxDays: 60 },
  { code: 'TITANIO', label: 'TITANIO', pricePerDayCredits: 50,  minDays: 1, maxDays: 60 },
  { code: 'GIRL',    label: 'Ragazza del Giorno', creditsCost: 300, durationDays: 1 },
]

const orderMap: Record<string, number> = { VIP: 1, ORO: 2, ARGENTO: 3, TITANIO: 4, GIRL: 5 }

function numOrNull(v: any): number | null {
  if (v === undefined || v === null) return null
  if (typeof v === 'string' && v.trim() === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

async function ensureSeed() {
  const count = await prisma.creditProduct.count()
  if (count > 0) return
  for (const d of DEFAULTS) {
    await prisma.creditProduct.upsert({
      where: { code: d.code },
      update: {},
      create: {
        code: d.code,
        label: d.label,
        creditsCost: d.creditsCost ?? 0,
        durationDays: d.durationDays ?? 1,
        pricePerDayCredits: d.pricePerDayCredits ?? null,
        minDays: d.minDays ?? null,
        maxDays: d.maxDays ?? null,
        active: true,
      },
    })
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await ensureSeed()
    if (req.method === 'GET') {
      const products = await prisma.creditProduct.findMany()
      products.sort((a,b)=> (orderMap[a.code]||99)-(orderMap[b.code]||99))
      return res.status(200).json({ products })
    }

    if (req.method === 'POST') {
      const { code, label } = req.body || {}
      const creditsCost = numOrNull(req.body?.creditsCost) ?? 0
      const durationDays = numOrNull(req.body?.durationDays) ?? 1
      const pricePerDayCredits = numOrNull(req.body?.pricePerDayCredits)
      const minDays = numOrNull(req.body?.minDays)
      const maxDays = numOrNull(req.body?.maxDays)
      const active = req.body?.active === undefined ? true : Boolean(req.body?.active)
      if (!code || !label) return res.status(400).json({ error: 'code e label sono obbligatori' })
      const saved = await prisma.creditProduct.upsert({
        where: { code },
        update: { label, creditsCost, durationDays, pricePerDayCredits, minDays, maxDays, active },
        create: { code, label, creditsCost, durationDays, pricePerDayCredits, minDays, maxDays, active },
      })
      return res.status(200).json({ product: saved })
    }

    if (req.method === 'PATCH') {
      const { id, code } = req.body || {}
      if (!id && !code) return res.status(400).json({ error: 'id o code obbligatorio' })
      const patch: any = {}
      if (req.body?.label !== undefined) patch.label = String(req.body.label)
      if (req.body?.creditsCost !== undefined) patch.creditsCost = numOrNull(req.body.creditsCost) ?? 0
      if (req.body?.durationDays !== undefined) patch.durationDays = numOrNull(req.body.durationDays) ?? 1
      if (req.body?.pricePerDayCredits !== undefined) patch.pricePerDayCredits = numOrNull(req.body.pricePerDayCredits)
      if (req.body?.minDays !== undefined) patch.minDays = numOrNull(req.body.minDays)
      if (req.body?.maxDays !== undefined) patch.maxDays = numOrNull(req.body.maxDays)
      if (req.body?.active !== undefined) patch.active = Boolean(req.body.active)
      
      console.log('PATCH request body:', req.body)
      console.log('Processed patch data:', patch)
      
      const saved = await prisma.creditProduct.update({
        where: id ? { id: Number(id) } : { code },
        data: patch,
      })
      
      console.log('Saved product:', saved)
      return res.status(200).json({ product: saved })
    }

    res.setHeader('Allow', 'GET, POST, PATCH')
    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Internal Server Error' })
  }
}
