import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  console.log('🔍 API /api/public/escort-indipendenti chiamata')
  
  try {
    const { citta, capelli, eta_min, eta_max, prezzo_min, prezzo_max } = req.query

    // Mostra escort indipendenti con almeno un documento APPROVATO
    const escorts = await prisma.user.findMany({
      where: {
        ruolo: 'escort',
        documents: { some: { status: 'APPROVED' } },
      },
      select: {
        id: true,
        nome: true,
        slug: true,
        createdAt: true,
        escortProfile: { select: { tier: true, cities: true, girlOfTheDayDate: true, contacts: true, tierExpiresAt: true } },
        photos: { where: { status: 'APPROVED' }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: [
        { escortProfile: { girlOfTheDayDate: 'desc' } as any }, // Prisma consente orderBy per relazioni 1-1
        { createdAt: 'desc' }
      ],
      take: 60,
    })

    // Aggiungo conteggi video, recensioni e commenti
    const escortsWithCounts = await Promise.all(escorts.map(async (u) => {
      const [videoCount, reviewCount, commentCount] = await Promise.all([
        prisma.video.count({ where: { userId: u.id, status: 'APPROVED' as any } }),
        prisma.review.count({ where: { targetUserId: u.id, status: 'APPROVED' as any } }),
        prisma.comment.count({ where: { targetUserId: u.id, status: 'APPROVED' as any } })
      ])
      return { ...u, videoCount, reviewCount, commentCount }
    }))

    // Funzione per ordinare i tier: VIP > ORO > ARGENTO > TITANIO > STANDARD
    const getTierPriority = (tier: string, tierExpiresAt: any, isGirlOfDay: boolean) => {
      // Se tier è scaduto o in pausa (tierExpiresAt null), diventa STANDARD
      const now = new Date()
      const isExpired = !tierExpiresAt || new Date(tierExpiresAt) <= now
      if (isExpired && !isGirlOfDay) {
        return 100 // STANDARD quando in pausa o scaduto
      }
      
      const t = String(tier || 'STANDARD').toUpperCase()
      switch (t) {
        case 'VIP': return 500
        case 'ORO': return 400
        case 'ARGENTO': return 300
        case 'TITANIO': return 200
        case 'STANDARD': return 100
        default: return 50
      }
    }

    // Ordina per tier priority dopo aver recuperato i dati
    const sortedEscorts = escortsWithCounts.sort((a, b) => {
      // Prima: Ragazza del Giorno (se presente)
      const aGirl = (() => {
        const d: any = a.escortProfile?.girlOfTheDayDate
        if (!d) return false
        const today = new Date().toISOString().slice(0,10)
        const dd = new Date(d).toISOString().slice(0,10)
        return dd === today
      })()
      const bGirl = (() => {
        const d: any = b.escortProfile?.girlOfTheDayDate
        if (!d) return false
        const today = new Date().toISOString().slice(0,10)
        const dd = new Date(d).toISOString().slice(0,10)
        return dd === today
      })()
      
      if (aGirl && !bGirl) return -1
      if (!aGirl && bGirl) return 1
      
      // Poi: Tier priority (VIP > ORO > ARGENTO > TITANIO > STANDARD)
      const aTier = a.escortProfile?.tier || 'STANDARD'
      const bTier = b.escortProfile?.tier || 'STANDARD'
      const aPriority = getTierPriority(aTier, a.escortProfile?.tierExpiresAt, aGirl)
      const bPriority = getTierPriority(bTier, b.escortProfile?.tierExpiresAt, bGirl)
      // Ordine DECRESCENTE (priorità più alta prima)
      const tierDiff = bPriority - aPriority
      if (tierDiff !== 0) return tierDiff
      
      // Infine: Data di registrazione (più recenti prima)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    const escortsFormatted = sortedEscorts.map((u) => {
      const cities = (() => {
        const raw = (u.escortProfile as any)?.cities
        const obj = (raw && typeof raw === 'object' && !Array.isArray(raw)) ? raw : {}
        const agg: string[] = []

        if (Array.isArray((obj as any).cities)) agg.push(...(obj as any).cities)
        const baseCity = (obj as any).baseCity || (obj as any).base || (obj as any).city
        const secondCity = (obj as any).secondCity
        const thirdCity = (obj as any).thirdCity
        const fourthCity = (obj as any).fourthCity
        for (const c of [baseCity, secondCity, thirdCity, fourthCity]) {
          if (c) agg.push(String(c))
        }

        if (Array.isArray(raw)) agg.push(...raw.map((x: any) => String(x)))

        if (Array.isArray((obj as any).internationalCities)) {
          for (const cityStr of (obj as any).internationalCities) {
            if (typeof cityStr === 'string' && cityStr.includes(', ')) {
              const [cityName] = cityStr.split(', ')
              if (cityName) agg.push(cityName)
            }
          }
        }

        return Array.from(new Set(agg.filter(Boolean)))
      })()

      const city = cities[0] || 'Milano'
      const fotoRaw = u.photos[0]?.url || '/images/placeholder.jpg'
      const foto = fotoRaw.startsWith('/uploads/') ? ('/api' + fotoRaw) : fotoRaw
      
      const girl = (() => {
        const d: any = (u as any).escortProfile?.girlOfTheDayDate
        if (!d) return false
        const today = new Date().toISOString().slice(0,10)
        const dd = new Date(d).toISOString().slice(0,10)
        return dd === today
      })()
      
      // Se tier è scaduto o in pausa, mostra come STANDARD
      const now = new Date()
      const tierExpiresAt = u.escortProfile?.tierExpiresAt
      const isExpired = !tierExpiresAt || new Date(tierExpiresAt) <= now
      const rank = (isExpired && !girl) ? 'STANDARD' : (u.escortProfile?.tier || 'STANDARD')
      const displayName = (() => {
        try {
          const cts: any = (u.escortProfile as any)?.contacts || {}
          return (cts.bioInfo?.nomeProfilo) || u.nome
        } catch { return u.nome }
      })()
      return {
        id: u.id,
        slug: u.slug || `${u.nome?.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-${u.id}`,
        nome: displayName,
        eta: 25,
        citta: city,
        cities,
        capelli: undefined,
        prezzo: 100,
        foto,
        rank,
        verificata: true,
        pacchettoAttivo: true,
        girlOfTheDay: girl,
        videoCount: u.videoCount,
        reviewCount: u.reviewCount,
        commentCount: u.commentCount,
      }
    })

    return res.status(200).json({ success: true, escorts: escortsFormatted, total: escortsFormatted.length })

  } catch (error: unknown) {
    console.error('❌ ERRORE in /api/public/escort-indipendenti:', error)
    return res.status(500).json({ 
      error: 'Errore interno del server',
      escorts: [],
      total: 0
    })
  }
}
