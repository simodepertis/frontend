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
      },
      // Solo utenti attivi
      isActive: true,
    }

    // Cerca nelle città dell'escort profile
    // Supporta sia la struttura legacy (array) che quella nuova (object con baseCity, secondCity, etc.)
    const cityFilter = {
      OR: [
        // Struttura legacy: cities è un array di stringi
        {
          escortProfile: {
            cities: {
              array_contains: city
            }
          }
        },
        // Struttura nuova: cities è un oggetto con baseCity, secondCity, etc.
        {
          escortProfile: {
            cities: {
              path: ['baseCity'],
              equals: city
            }
          }
        },
        {
          escortProfile: {
            cities: {
              path: ['secondCity'],
              equals: city
            }
          }
        },
        {
          escortProfile: {
            cities: {
              path: ['thirdCity'],
              equals: city
            }
          }
        },
        {
          escortProfile: {
            cities: {
              path: ['fourthCity'],
              equals: city
            }
          }
        },
        // Anche nelle città aggiuntive se è un array
        {
          escortProfile: {
            cities: {
              path: ['cities'],
              array_contains: city
            }
          }
        }
      ]
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

    // Formatta i risultati
    const results = users.map(user => {
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

      return {
        id: user.id,
        nome: user.nome,
        slug: user.slug,
        citta: mainCity,
        prezzo: minPrice,
        tier: profile?.tier || 'STANDARD',
        coverUrl: photosByUser[user.id] || '/placeholder.svg',
        updatedAt: profile?.updatedAt || user.createdAt,
      }
    })

    return res.json({
      results,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    })

  } catch (error) {
    console.error('❌ Errore ricerca per città:', error)
    return res.status(500).json({ error: 'Errore interno del server' })
  }
}
