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

function tierPriority(tier: string, isGirlOfDay: boolean, tierExpiresAt: any) {
  // Ragazza del Giorno ha sempre priorità massima
  if (isGirlOfDay) return 1000
  
  // Se tier è scaduto o in pausa (tierExpiresAt null), diventa STANDARD
  const now = new Date()
  const isExpired = !tierExpiresAt || new Date(tierExpiresAt) <= now
  if (isExpired && !isGirlOfDay) {
    return 100 // STANDARD quando in pausa o scaduto
  }
  
  // Ordine corretto: VIP > ORO > ARGENTO > TITANIO > STANDARD
  const t = String(tier || 'STANDARD').toUpperCase()
  if (t === 'VIP') return 500
  if (t === 'ORO') return 400
  if (t === 'ARGENTO') return 300
  if (t === 'TITANIO') return 200
  return 100 // STANDARD
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
      // Profili escort (annunci fisici) - include sia escort indipendenti che agenzia
      const profiles = await prisma.escortProfile.findMany({
        include: { 
          user: { select: { id: true, nome: true, slug: true, documents: { select: { status: true } } } },
          agency: { select: { id: true, nome: true } }
        },
        orderBy: { updatedAt: 'desc' },
      })

      // Mappa profili base
      const base = profiles.map((p: any) => {
        // CORREZIONE: p.cities è un oggetto JSON, non un array
        const citiesData = p.cities || {}
        const cities = Array.isArray(citiesData.cities) ? citiesData.cities : []
        const explicitCountries = Array.isArray(citiesData.countries) ? citiesData.countries.map((c:any)=>String(c).toUpperCase()) : []
        const isGirl = p.girlOfTheDayDate ? p.girlOfTheDayDate.toISOString().slice(0, 10) === todayStr : false
        
        // Debug per profili con dati internazionali
        if (cities.length > 0 || explicitCountries.length > 0) {
          console.log(`🔍 Profilo ${p.userId} - cities:`, cities, `countries:`, explicitCountries, `citiesData:`, citiesData)
        }
        const displayName = (() => { try { return (p?.contacts as any)?.bioInfo?.nomeProfilo || p.user?.nome || `User ${p.userId}` } catch { return p.user?.nome || `User ${p.userId}` } })()
        const prio = tierPriority(p.tier as any, isGirl, p.tierExpiresAt)
        
        // Debug logging per tier priority E ragazza del giorno
        if (p.tier === 'ORO' || p.tier === 'TITANIO' || isGirl) {
          console.log(`🔍 ${displayName}: tier=${p.tier}, isGirl=${isGirl}, girlOfTheDayDate=${p.girlOfTheDayDate}, todayStr=${todayStr}, priority=${prio}`)
        }
        const slug = p.user?.slug || `${kebab(p.user?.nome || '')}-${p.user?.id}`
        const hasApprovedDoc = Array.isArray(p.user?.documents) && p.user.documents.some((d:any)=> d.status === 'APPROVED')
        const price = pickPriceFromRates(p.rates as any)
        const isAgencyEscort = !!p.agencyId
        
        // Log per debug escort agenzia
        if (isAgencyEscort) {
          console.log(`🏢 Escort agenzia trovata: ${displayName} (ID: ${p.userId}, AgencyID: ${p.agencyId}, HasApprovedDoc: ${hasApprovedDoc})`)
        }
        
        // Se tier è scaduto o in pausa, mostra come STANDARD
        const now = new Date()
        const isExpired = !p.tierExpiresAt || new Date(p.tierExpiresAt) <= now
        const effectiveTier = (isExpired && !isGirl) ? 'STANDARD' : p.tier
        
        return {
          id: p.userId,
          name: displayName,
          slug,
          cities,
          countries: explicitCountries,
          tier: effectiveTier,
          girlOfTheDay: isGirl,
          priority: prio,
          updatedAt: p.updatedAt,
          hasApprovedDoc,
          price: price || 0,
          isAgencyEscort,
          agencyName: p.agency?.nome || null,
          tierExpiresAt: p.tierExpiresAt, // Mantieni per debug
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
      const matchesCountry = (list: any[], code: string, explicit?: string[]) => {
        if (!code) return true
        const set = new Set((COUNTRY_CITIES[code] || []).map(norm))
        if (set.size === 0) return true
        
        // Controlla se ha città del paese
        const byCity = Array.isArray(list) && list.some((c:any) => set.has(norm(c)))
        
        // Controlla se ha il paese esplicitamente selezionato
        const byExplicit = Array.isArray(explicit) && explicit.includes(code)
        
        // NUOVO: Controlla anche per nomi di città esatti (Paris, London, ecc.)
        const exactCityMatch = Array.isArray(list) && list.some((c:any) => {
          const cityNorm = norm(c)
          // Mapping città internazionali comuni
          const cityToCountry: Record<string, string[]> = {
            'paris': ['FR'], 'parigi': ['FR'],
            'london': ['UK'], 'londra': ['UK'],
            'zurich': ['CH'], 'zurigo': ['CH'],
            'geneva': ['CH'], 'ginevra': ['CH'],
            'berlin': ['DE'], 'berlino': ['DE'],
            'madrid': ['ES'],
            'barcelona': ['ES'], 'barcellona': ['ES'],
            'amsterdam': ['NL'],
            'brussels': ['BE'], 'bruxelles': ['BE']
          }
          return cityToCountry[cityNorm]?.includes(code) || false
        })
        
        const result = byCity || byExplicit || exactCityMatch
        
        // Debug per paesi internazionali
        if (['CH', 'FR', 'UK'].includes(code)) {
          console.log(`🔍 ${code} Debug - cities:`, list, `explicit:`, explicit, `byCity:`, byCity, `byExplicit:`, byExplicit, `exactCityMatch:`, exactCityMatch, `result:`, result)
        }
        
        return result
      }

      const filteredBase = base.filter((x: any) => {
        const cityMatch = !city || matchesCity(x.cities, city)
        const countryMatch = !country || matchesCountry(x.cities, country, x.countries)
        const queryMatch = !q || String(x.name).toLowerCase().includes(q) || (Array.isArray(x.cities) && x.cities.some((c: any) => String(c).toLowerCase().includes(q)))
        const result = cityMatch && countryMatch && queryMatch
        
        // Debug per filtri Francia
        if (country === 'FR' && (x.countries?.includes('FR') || x.cities?.some((c:any) => ['paris', 'parigi'].includes(String(c).toLowerCase())))) {
          console.log(`🔍 FILTRO FR - Profilo ${x.id}:`, {
            cities: x.cities,
            countries: x.countries,
            cityMatch,
            countryMatch,
            queryMatch,
            result,
            filters: { city, country, q }
          })
        }
        
        return result
      })

      // Allego cover APPROVED + conteggi video, recensioni e commenti
      const withMeta = await Promise.all(filteredBase.map(async (it: any) => {
        const [cover, videoCount, reviewCount, commentCount] = await Promise.all([
          prisma.photo.findFirst({ where: { userId: it.id, status: 'APPROVED' as any }, orderBy: { updatedAt: 'desc' } }),
          prisma.video.count({ where: { userId: it.id, status: 'APPROVED' as any } }),
          prisma.review.count({ where: { targetUserId: it.id, status: 'APPROVED' as any } }),
          prisma.comment.count({ where: { targetUserId: it.id, status: 'APPROVED' as any } })
        ])
        return { ...it, coverUrl: normalizeUrl(cover?.url), videoCount, reviewCount, commentCount }
      }))

      // PUBBLICAZIONE aggiornata:
      // - Mostra SEMPRE chi ha almeno un documento APPROVED
      // - Se manca cover APPROVED, usa placeholder ma con priorità bassa
      const approvedEscorts = withMeta.filter(x => x.hasApprovedDoc)
      const agencyEscortsCount = approvedEscorts.filter(x => x.isAgencyEscort).length
      const independentEscortsCount = approvedEscorts.filter(x => !x.isAgencyEscort).length
      
      console.log(`📊 Escort approvate: ${approvedEscorts.length} totali (${independentEscortsCount} indipendenti, ${agencyEscortsCount} agenzia)`)
      
      mapped = approvedEscorts.map(x => ({
        ...x,
        coverUrl: normalizeUrl(x.coverUrl) || '/placeholder.svg',
        // NON ridurre la priorità se manca la cover - mantieni tier priority
      }))
    }

    // Ordinamento IDENTICO a escort-indipendenti che FUNZIONA
    mapped.sort((a, b) => {
      // Prima: Ragazza del Giorno (se presente)
      if (a.girlOfTheDay && !b.girlOfTheDay) {
        console.log(`👑 RAGAZZA DEL GIORNO PRIMA: ${a.name} (girlOfTheDay: ${a.girlOfTheDay})`)
        return -1
      }
      if (!a.girlOfTheDay && b.girlOfTheDay) {
        console.log(`👑 RAGAZZA DEL GIORNO PRIMA: ${b.name} (girlOfTheDay: ${b.girlOfTheDay})`)
        return 1
      }
      
      // Poi: Tier priority (VIP > ORO > ARGENTO > TITANIO > STANDARD)
      const aPriority = tierPriority(a.tier || 'STANDARD', a.girlOfTheDay || false, a.tierExpiresAt)
      const bPriority = tierPriority(b.tier || 'STANDARD', b.girlOfTheDay || false, b.tierExpiresAt)
      // Ordine DECRESCENTE (priorità più alta prima)
      const tierDiff = bPriority - aPriority
      if (tierDiff !== 0) return tierDiff
      
      // Infine: Data di aggiornamento (più recenti prima)
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

    const total = mapped.length
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const pageItems = mapped.slice(start, end)

    return res.json({ total, page, pageSize, items: pageItems })
  } catch (e) {
    return res.status(500).json({ error: 'Errore interno' })
  }
}
