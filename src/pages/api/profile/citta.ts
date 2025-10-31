import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function getUserId(req: NextApiRequest): number | null {
  const auth = req.headers.authorization
  const token = auth?.startsWith('Bearer ') ? auth.substring(7) : (req.cookies as any)['auth-token']
  if (!token) return null
  const payload = verifyToken(token)
  return payload?.userId ?? null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Non autenticato' })

  try {
    if (req.method === 'GET') {
      const profile = await prisma.escortProfile.findUnique({ where: { userId } })
      if (!profile) return res.status(404).json({ error: 'Profilo non trovato' })
      
      const cities = (profile.cities as any) || []
      return res.status(200).json({ 
        cities,
        countries: cities,
        internationalCities: cities,
        zones: [],
        position: { lat: 41.9028, lng: 12.4964 },
        availability: { incall: {}, outcall: { enabled: true } }
      })
    }

    if (req.method === 'PATCH') {
      const { cities, countries, internationalCities, zones, position, availability } = req.body || {}
      
      // Salva cities (merge di tutte le città italiane + internazionali)
      const allCities = [...(cities || []), ...(internationalCities || [])].filter(Boolean)
      
      await prisma.escortProfile.upsert({
        where: { userId },
        update: { 
          cities: allCities.length > 0 ? allCities : undefined 
        },
        create: { 
          userId, 
          cities: allCities.length > 0 ? allCities : []
        }
      })

      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Metodo non consentito' })
  } catch (err) {
    console.error('API /api/profile/citta errore:', err)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
