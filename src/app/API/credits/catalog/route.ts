import { NextResponse } from 'next/server'
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
  try {
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
          pricePerDayCredits: (d as any).pricePerDayCredits ?? null,
          minDays: (d as any).minDays ?? null,
          maxDays: (d as any).maxDays ?? null,
          active: true,
        },
      })
    }
  } catch {}
}

export async function GET() {
  try {
    try {
      await ensureSeed()
      const rows = await prisma.creditProduct.findMany({ where: { active: true } })
      const pick = (key: 'VIP'|'ORO'|'ARGENTO'|'TITANIO'|'GIRL') => {
        const exact = rows.find(r => r.code === key)
        if (exact) return exact
        const pref = rows.find(r => r.code?.toUpperCase()?.startsWith(key))
        return pref ?? null
      }
      const orderedKeys: Array<'VIP'|'ORO'|'ARGENTO'|'TITANIO'|'GIRL'> = ['VIP','ORO','ARGENTO','TITANIO','GIRL']
      const products = orderedKeys.map(k => {
        const r = pick(k)
        if (r) return {
          code: k,
          label: r.label,
          creditsCost: r.creditsCost,
          durationDays: r.durationDays,
          pricePerDayCredits: r.pricePerDayCredits ?? undefined,
          minDays: r.minDays ?? undefined,
          maxDays: r.maxDays ?? undefined,
        }
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
      })
      return NextResponse.json({ products }, { status: 200 })
    } catch {}
    // fallback statico
    const products = DEFAULTS.map(d => ({
      code: d.code,
      label: d.label,
      creditsCost: (d as any).creditsCost ?? 0,
      durationDays: (d as any).durationDays ?? 1,
      pricePerDayCredits: (d as any).pricePerDayCredits,
      minDays: (d as any).minDays,
      maxDays: (d as any).maxDays,
    }))
    products.sort((a,b)=> (orderMap[a.code]||99)-(orderMap[b.code]||99))
    return NextResponse.json({ products }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
