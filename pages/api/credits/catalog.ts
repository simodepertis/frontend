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
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }
  try {
    try {
      await ensureSeed()
      const rows = await prisma.creditProduct.findMany({ where: { active: true } })
      
      // Funzione per trovare prodotto per chiave
      const pick = (key: 'VIP'|'ORO'|'ARGENTO'|'TITANIO'|'GIRL') => {
        // Prima cerca codice esatto
        const exact = rows.find(r => r.code === key)
        if (exact) return exact
        // Poi cerca per prefisso (es. "VIP 7 giorni" -> VIP)
        const prefixed = rows.find(r => r.code?.toUpperCase()?.startsWith(key))
        return prefixed ?? null
      }
      
      const orderedKeys: Array<'VIP'|'ORO'|'ARGENTO'|'TITANIO'|'GIRL'> = ['VIP','ORO','ARGENTO','TITANIO','GIRL']
      const products = orderedKeys.map(k => {
        const r = pick(k)
        if (r) return {
          code: k, // Normalizza sempre a VIP/ORO/etc per UI
          label: r.label,
          creditsCost: r.creditsCost,
          durationDays: r.durationDays,
          pricePerDayCredits: r.pricePerDayCredits ?? undefined,
          minDays: r.minDays ?? undefined,
          maxDays: r.maxDays ?? undefined,
        }
        // Fallback al default per questa chiave
        const d: any = DEFAULTS.find(x => x.code === k)
        return {
          code: k,
          label: d?.label ?? k,
          creditsCost: d?.creditsCost ?? 0,
          durationDays: d?.durationDays ?? 1,
          pricePerDayCredits: d?.pricePerDayCredits,
          minDays: d?.minDays,
          maxDays: d?.maxDays,
        }
      }).filter(Boolean)
      if (products.length > 0) return res.status(200).json({ products })
    } catch {}
    // Fallback immediato: mostra i 5 default se il DB non è disponibile
    const products = DEFAULTS.map(d => ({
      code: d.code,
      label: d.label,
      creditsCost: d.creditsCost ?? 0,
      durationDays: d.durationDays ?? 1,
      pricePerDayCredits: d.pricePerDayCredits,
      minDays: d.minDays,
      maxDays: d.maxDays,
    }))
    products.sort((a,b)=> (orderMap[a.code]||99)-(orderMap[b.code]||99))
    return res.status(200).json({ products })
  } catch (e) {
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
