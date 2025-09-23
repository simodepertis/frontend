import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

function pickPriceFromRates(rates: any): number | null {
  if (!rates || typeof rates !== 'object') return null
  // Prefer common keys; fallback to minimum numeric
  const preferredKeys = ['hour_1', 'hour1', '60', '30', 'mezzora', '1h', '2h']
  for (const k of preferredKeys) {
    const v = (rates as any)[k]
    const num = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v.replace(/[^0-9]/g, '')) : NaN)
    if (!Number.isNaN(num) && num > 0) return num
  }
  let min: number | null = null
  for (const v of Object.values(rates)) {
    const num = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v.replace(/[^0-9]/g, '')) : NaN)
    if (!Number.isNaN(num) && num > 0) min = min === null ? num : Math.min(min, num)
  }
  return min
}

function normalizeUrl(u: string | null | undefined): string {
  const s = String(u || '')
  if (s.startsWith('/uploads/')) return '/api' + s
  return s
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const page = Math.max(1, Number(req.query.page || 1))
    const perPage = Math.min(60, Math.max(1, Number(req.query.perPage || 12)))
    const city = String(req.query.city || '').trim().toLowerCase()
    const tag = String(req.query.tag || '').trim().toLowerCase()

    // Get approved photos with user, escort profile, and documents
    const photos = await prisma.photo.findMany({
      where: { status: 'APPROVED' as any },
      orderBy: { updatedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            nome: true,
            escortProfile: { select: { cities: true, rates: true } },
            documents: { select: { status: true } },
          }
        }
      }
    })

    const itemsBase = photos.map((p) => {
      const cities = Array.isArray(p.user?.escortProfile?.cities) ? (p.user!.escortProfile!.cities as any[]) : []
      const firstCity = cities.length ? String(cities[0]) : ''
      const hasApprovedDoc = Array.isArray(p.user?.documents) && p.user!.documents.some(d => d.status === 'APPROVED')
      const price = pickPriceFromRates(p.user?.escortProfile?.rates as any)
      return {
        id: p.id,
        url: normalizeUrl(p.url),
        status: p.status,
        userId: p.userId,
        city: firstCity,
        verified: hasApprovedDoc,
        price: price || 0,
        hd: false,
        isNew: false,
      }
    })

    const filtered = itemsBase.filter(it => (
      (!city || String(it.city).toLowerCase().includes(city)) &&
      (!tag || (tag === 'verificata' ? it.verified : true))
    ))

    const total = filtered.length
    const start = (page - 1) * perPage
    const pageItems = filtered.slice(start, start + perPage)

    return res.json({ items: pageItems, total, page, perPage })
  } catch (e) {
    console.error('❌ API public/photos error:', e)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
