import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

function pickPriceFromRates(rates: any): number | null {
  if (!rates || typeof rates !== 'object') return null
  const prefer = ['hour_1','hour1','1h','60','mezzora','30']
  for (const k of prefer) {
    const v = (rates as any)[k]
    const num = typeof v === 'number' ? v : (typeof v === 'string' ? Number(String(v).replace(/[^0-9]/g,'')) : NaN)
    if (!Number.isNaN(num) && num > 0) return num
  }
  let min: number | null = null
  for (const v of Object.values(rates)) {
    const num = typeof v === 'number' ? v : (typeof v === 'string' ? Number(String(v).replace(/[^0-9]/g,'')) : NaN)
    if (!Number.isNaN(num) && num > 0) min = min === null ? num : Math.min(min, num)
  }
  return min
}

function tierPriority(tier: string, isGirlOfDay: boolean) {
  if (tier === 'VIP') return 100
  if (isGirlOfDay) return 90
  if (tier === 'TITANIO') return 80
  if (tier === 'ORO') return 70
  if (tier === 'ARGENTO') return 60
  return 0
}

function kebab(s: string) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function normalizeUrl(u: string | null | undefined): string | null {
  const s = String(u || '')
  if (!s) return null
  if (s.startsWith('/uploads/')) return '/api' + s
  return s
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const city = String(req.query.citta || '').trim().toLowerCase()
    const country = String(req.query.country || '').trim().toUpperCase()
    const type = String(req.query.type || '').trim().toUpperCase() // VIRTUAL|PHYSICAL
    const page = Math.max(1, Number(req.query.page || 1))
    const q = String(req.query.q || '').trim().toLowerCase()
    const pageSize = 40

    let mapped: any[] = []
    const todayStr = new Date().toISOString().slice(0, 10)

    if (type === 'VIRTUAL') {
      const listings = await prisma.listing.findMany({
        where: { status: 'PUBLISHED', type: 'VIRTUAL' as any },
        include: { user: { select: { id: true, nome: true, slug: true, escortProfile: { select: { contacts: true } } } } },
        orderBy: { createdAt: 'desc' },
      })
      mapped = (listings as any[]).map((l: any) => {
        const slug = l.user?.slug || `${kebab(l.user?.nome || '')}-${l.user?.id}`
        const cities = [l.city].filter(Boolean)
        const displayName = (()=>{ try { return (l.user?.escortProfile as any)?.contacts?.bioInfo?.nomeProfilo || l.title || l.user?.nome || `User ${l.userId}` } catch { return l.title || l.user?.nome || `User ${l.userId}` } })()
        return {
          id: l.userId,
          name: displayName,
          slug,
          cities,
          tier: 'STANDARD',
          girlOfTheDay: false,
          priority: 0,
          updatedAt: l.createdAt,
        }
      }).filter((x: any) => (!city || x.cities.some((c: string) => String(c).toLowerCase().includes(city))) && (!q || String(x.name).toLowerCase().includes(q) || x.cities.some((c: string) => String(c).toLowerCase().includes(q))))
    } else {
      // Profili escort (annunci fisici)
      const profiles = await prisma.escortProfile.findMany({
        include: { user: { select: { id: true, nome: true, slug: true, documents: { select: { status: true } } } } },
        orderBy: { updatedAt: 'desc' },
      })

      // Mappa profili base
      const base = profiles.map((p: any) => {
        const cities = Array.isArray(p.cities) ? (p.cities as any[]) : []
        const isGirl = p.girlOfTheDayDate ? p.girlOfTheDayDate.toISOString().slice(0, 10) === todayStr : false
        const prio = tierPriority(p.tier as any, isGirl)
        const slug = p.user?.slug || `${kebab(p.user?.nome || '')}-${p.user?.id}`
        const hasApprovedDoc = Array.isArray(p.user?.documents) && p.user.documents.some((d:any)=> d.status === 'APPROVED')
        const price = pickPriceFromRates(p.rates as any)
        const displayName = (() => { try { return (p?.contacts as any)?.bioInfo?.nomeProfilo || p.user?.nome || `User ${p.userId}` } catch { return p.user?.nome || `User ${p.userId}` } })()
        return {
          id: p.userId,
          name: displayName,
          slug,
          cities,
          tier: p.tier,
          girlOfTheDay: isGirl,
          priority: prio,
          updatedAt: p.updatedAt,
          hasApprovedDoc,
          price: price || 0,
        } as any
      })

      // Country sets (lowercase normalized)
      const COUNTRY_CITIES: Record<string, string[]> = {
        IT: ['milano','roma','torino','napoli','bologna','firenze','venezia','genova','palermo','bari','verona','brescia','catania','trieste','udine','lecce'],
        FR: ['parigi','paris','marsiglia','marseille','lione','lyon','tolosa','toulouse','nizza','nice','bordeaux','lille','nantes','strasburgo','strasbourg'],
        UK: ['londra','london','manchester','birmingham','leeds','liverpool','glasgow','edinburgh','bristol'],
        DE: ['berlino','berlin','monaco','munich','amburgo','hamburg','colonia','koln','köln','francoforte','frankfurt','stoccarda','stuttgart'],
        ES: ['madrid','barcellona','barcelona','valencia','siviglia','sevilla','bilbao','malaga','saragozza','zaragoza'],
        CH: ['zurigo','zürich','ginevra','geneva','basilea','basel','losanna','lausanne','lugano','bern','berna'],
        NL: ['amsterdam','rotterdam','l\'aia','the hague','den haag','utrecht','eindhoven'],
        BE: ['bruxelles','brussels','anversa','antwerp','gand','ghent','liegi','liège'],
      }

      const norm = (s: any) => String(s || '').trim().toLowerCase()
      const matchesCity = (list: any[], needle: string) => {
        if (!needle) return true
        const n = norm(needle)
        return Array.isArray(list) && list.some((c:any) => norm(c).includes(n))
      }
      const matchesCountry = (list: any[], code: string) => {
        if (!code) return true
        const set = new Set((COUNTRY_CITIES[code] || []).map(norm))
        if (set.size === 0) return true
        return Array.isArray(list) && list.some((c:any) => set.has(norm(c)))
      }

      const filteredBase = base.filter((x: any) => (
        (!city || matchesCity(x.cities, city)) &&
        (!country || matchesCountry(x.cities, country)) &&
        (!q || String(x.name).toLowerCase().includes(q) || (Array.isArray(x.cities) && x.cities.some((c: any) => String(c).toLowerCase().includes(q))))
      ))

      // Allego cover APPROVED
      const withMeta = await Promise.all(filteredBase.map(async (it: any) => {
        const cover = await prisma.photo.findFirst({ where: { userId: it.id, status: 'APPROVED' as any }, orderBy: { updatedAt: 'desc' } })
        return { ...it, coverUrl: normalizeUrl(cover?.url) }
      }))

      // PUBBLICAZIONE aggiornata:
      // - Mostra SEMPRE chi ha almeno un documento APPROVED
      // - Se manca cover APPROVED, usa placeholder ma con priorità bassa
      mapped = withMeta
        .filter(x => x.hasApprovedDoc)
        .map(x => ({
          ...x,
          coverUrl: normalizeUrl(x.coverUrl) || '/placeholder.svg',
          priority: x.coverUrl ? x.priority : Math.min(x.priority, 10),
        }))
    }

    // Sort by priority desc then updatedAt desc
    mapped.sort((a, b) => (b.priority - a.priority) || (new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()))

    const total = mapped.length
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const pageItems = mapped.slice(start, end)

    return res.json({ total, page, pageSize, items: pageItems })
  } catch (e) {
    return res.status(500).json({ error: 'Errore interno' })
  }
}
