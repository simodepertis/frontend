import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Prendi tutti i profili 
    const profiles = await prisma.escortProfile.findMany({
      include: { 
        user: { select: { id: true, nome: true } }
      },
      take: 10
    })

    const debug = profiles.map((p: any) => ({
      userId: p.userId,
      userName: p.user?.nome,
      rawCities: p.cities,
      citiesType: typeof p.cities,
      isArray: Array.isArray(p.cities),
      hasCountries: p.cities && typeof p.cities === 'object' && 'countries' in p.cities,
      hasCitiesArray: p.cities && typeof p.cities === 'object' && 'cities' in p.cities,
    }))

    return res.json({ 
      total: profiles.length,
      debug,
      message: 'Controllo struttura dati cities nel database'
    })
  } catch (error) {
    console.error('Errore debug cities:', error)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
