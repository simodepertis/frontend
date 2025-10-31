import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Metodo non consentito' })

  try {
    // Recupera tutti gli utenti escort con profilo
    const users = await prisma.user.findMany({
      where: { 
        ruolo: { in: ['escort', 'agency'] },
        suspended: false
      },
      include: {
        escortProfile: true,
        photos: {
          where: { status: 'APPROVED' },
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      },
      take: 100
    })

    const items = users
      .filter(u => u.escortProfile)
      .map(u => {
        const profile = u.escortProfile!
        const cities = (profile.cities as any) || []
        
        // Estrai countries dalle città internazionali
        const countries: string[] = []
        const intlCities: string[] = []
        
        if (Array.isArray(cities)) {
          cities.forEach((c: string) => {
            const city = String(c).trim()
            // Se contiene virgola, è formato "Città, Paese"
            if (city.includes(',')) {
              const parts = city.split(',').map(p => p.trim())
              if (parts.length >= 2) {
                intlCities.push(parts[0])
                const country = parts[parts.length - 1].toUpperCase()
                if (!countries.includes(country)) {
                  countries.push(country)
                }
              }
            } else {
              // Città italiana o internazionale semplice
              intlCities.push(city)
            }
          })
        }

        return {
          id: u.id,
          slug: u.slug || `escort-${u.id}`,
          name: u.nome,
          cities: intlCities,
          countries: countries.length > 0 ? countries : intlCities.length > 0 ? ['IT'] : [],
          tier: profile.tier || 'STANDARD',
          isVerified: profile.consentAcceptedAt ? true : false,
          coverUrl: u.photos[0]?.url || null
        }
      })

    return res.status(200).json({ items })
  } catch (err) {
    console.error('API /api/public/annunci errore:', err)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
