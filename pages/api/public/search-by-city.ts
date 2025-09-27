import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

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
    const { city, tipo, eta, prezzo, page = 1, limit = 20 } = req.query
    
    if (!city || typeof city !== 'string') {
      return res.status(400).json({ error: 'Parametro city obbligatorio' })
    }

    const pageNum = Number(page)
    const limitNum = Number(limit)
    const skip = (pageNum - 1) * limitNum

    // Costruisci i filtri per la ricerca
    const whereConditions: any = {
      // Solo utenti con profilo escort
      escortProfile: {
        isNot: null,
      }
    }

    // Cerca nelle città dell'escort profile - usa raw SQL per evitare problemi con JSON
    const cityFilter = {
      escortProfile: {
        cities: {
          not: null
        }
      }
    }

    whereConditions.AND = [cityFilter]

    // Filtro per tipo (se specificato)
    if (tipo && typeof tipo === 'string' && tipo !== '') {
      // Il tipo potrebbe essere salvato in contacts.bioInfo.sesso o contacts.bioInfo.tipoProfilo
      whereConditions.AND.push({
        OR: [
          {
            escortProfile: {
              contacts: {
                path: ['bioInfo', 'sesso'],
                equals: tipo
              }
            }
          },
          {
            escortProfile: {
              contacts: {
                path: ['bioInfo', 'tipoProfilo'],
                equals: tipo
              }
            }
          }
        ]
      })
    }

    console.log('🔍 Ricerca città:', city)
    console.log('📋 Condizioni WHERE:', JSON.stringify(whereConditions, null, 2))

    // Debug: verifica quante escort ci sono in totale
    const totalEscorts = await prisma.user.count({
      where: {
        escortProfile: { isNot: null }
      }
    })
    console.log(`📈 Totale escort nel database: ${totalEscorts}`)

    // Debug: mostra alcune escort con le loro città
    const sampleEscorts = await prisma.user.findMany({
      where: {
        escortProfile: { isNot: null }
      },
      include: {
        escortProfile: {
          select: { cities: true }
        }
      },
      take: 5
    })
    console.log('🔍 Campione escort e loro città:')
    sampleEscorts.forEach(u => {
      console.log(`👤 ${u.nome} (ID: ${u.id}) - Cities:`, u.escortProfile?.cities)
    })

    // Cerca gli utenti
    const users = await prisma.user.findMany({
      where: whereConditions,
      include: {
        escortProfile: {
          select: {
            tier: true,
            tierExpiresAt: true,
            cities: true,
            contacts: true,
            rates: true,
            updatedAt: true,
          }
        }
      },
      skip,
      take: limitNum,
      orderBy: [
        // Prima gli utenti con tier premium
        { escortProfile: { tier: 'desc' } },
        // Poi per data di aggiornamento
        { escortProfile: { updatedAt: 'desc' } },
        // Infine per ID
        { id: 'desc' }
      ]
    })

    console.log(`📊 Trovati ${users.length} utenti totali, filtro per città ${city}`)
    
    // Filtra per città dopo aver recuperato i dati - logica più permissiva
    const filteredUsers = users.filter(u => {
      const profile = u.escortProfile
      if (!profile) return false
      
      const cityLower = city.toLowerCase()
      
      // Cerca nelle città
      const cities = profile.cities
      if (cities) {
        // Se cities è una stringa, cerca direttamente
        if (typeof cities === 'string') {
          if (cities.toLowerCase().includes(cityLower)) return true
        }
        
        // Se cities è un oggetto, cerca in tutti i campi
        if (typeof cities === 'object' && cities !== null) {
          const cityStr = JSON.stringify(cities).toLowerCase()
          if (cityStr.includes(cityLower)) return true
        }
      }
      
      // Cerca anche nei contatti se presente
      try {
        const contacts = profile.contacts as any
        if (contacts) {
          const contactsStr = JSON.stringify(contacts).toLowerCase()
          if (contactsStr.includes(cityLower)) return true
        }
      } catch {}
      
      return false
    })
    
    console.log(`📊 Dopo filtro città: ${filteredUsers.length} utenti per ${city}`)
    filteredUsers.forEach(u => {
      console.log(`👤 User ${u.id} (${u.nome}) - Cities:`, u.escortProfile?.cities)
    })

    // Conta il totale per la paginazione
    const total = await prisma.user.count({ where: whereConditions })

    // Prendi le foto di copertina per ogni utente
    const userIds = users.map(u => u.id)
    const photos = await prisma.photo.findMany({
      where: {
        userId: { in: userIds },
        status: 'APPROVED'
      },
      orderBy: { updatedAt: 'desc' }
    })

    // Mappa foto per utente (prima foto approvata)
    const photosByUser: Record<number, string> = {}
    photos.forEach(photo => {
      if (!photosByUser[photo.userId]) {
        photosByUser[photo.userId] = normalizeUrl(photo.url) || '/placeholder.svg'
      }
    })

    // Formatta i risultati usando gli utenti filtrati
    const results = filteredUsers.map(user => {
      const profile = user.escortProfile
      const cities = profile?.cities || {}
      
      // Estrai la città principale
      let mainCity = String(city) // Default alla città cercata
      if (typeof cities === 'object' && !Array.isArray(cities)) {
        const c = cities as any
        mainCity = String(c.baseCity || c.secondCity || c.thirdCity || c.fourthCity || city)
      } else if (Array.isArray(cities) && cities.length > 0) {
        mainCity = String(cities[0] || city)
      }

      // Estrai il prezzo minimo dalle tariffe
      let minPrice = 150 // Default
      try {
        const rates = profile?.rates
        if (rates && typeof rates === 'object') {
          const prices: number[] = []
          if (Array.isArray(rates)) {
            rates.forEach((r: any) => {
              if (typeof r?.price === 'number') prices.push(r.price)
            })
          } else {
            Object.values(rates).forEach((r: any) => {
              const num = typeof r === 'number' ? r : (typeof r === 'string' ? Number(String(r).replace(/[^0-9]/g,'')) : NaN)
              if (!Number.isNaN(num) && num > 0) prices.push(num)
            })
          }
          if (prices.length > 0) minPrice = Math.min(...prices)
        }
      } catch {}

      // Estrai età dai contatti
      let eta = 25 // Default
      try {
        const contacts = profile?.contacts as any
        const bioInfo = contacts?.bioInfo
        if (bioInfo?.eta) eta = Number(bioInfo.eta) || 25
      } catch {}

      return {
        id: user.id,
        nome: user.nome,
        slug: user.slug,
        eta: eta,
        citta: mainCity,
        prezzo: minPrice,
        foto: photosByUser[user.id] || '/placeholder.svg',
        rank: profile?.tier || 'STANDARD',
        isVerified: false, // TODO: implementare logica verifica
        videoCount: 0, // TODO: contare video
        reviewCount: 0, // TODO: contare recensioni  
        commentCount: 0, // TODO: contare commenti
        updatedAt: profile?.updatedAt || user.createdAt,
      }
    })

    return res.json({
      results,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredUsers.length,
        totalPages: Math.ceil(filteredUsers.length / limitNum),
        hasNext: pageNum < Math.ceil(filteredUsers.length / limitNum),
        hasPrev: pageNum > 1
      }
    })

  } catch (error) {
    console.error('❌ Errore ricerca per città:', error)
    return res.status(500).json({ error: 'Errore interno del server' })
  }
}
