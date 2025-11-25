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

      const raw = (profile.cities as any) ?? {}

      let citiesObj: any
      if (Array.isArray(raw)) {
        citiesObj = { cities: raw }
      } else if (raw && typeof raw === 'object') {
        citiesObj = raw
      } else {
        citiesObj = {}
      }

      const position = citiesObj.position || { lat: 41.9028, lng: 12.4964 }
      const availability = citiesObj.availability || { incall: {}, outcall: { enabled: true } }

      return res.status(200).json({
        cities: citiesObj,
        countries: citiesObj.countries || [],
        internationalCities: citiesObj.internationalCities || [],
        zones: citiesObj.zones || [],
        position,
        availability,
      })
    }

    if (req.method === 'PATCH') {
      const body = req.body || {}

      const existingProfile = await prisma.escortProfile.findUnique({ where: { userId } })
      const currentRaw = (existingProfile?.cities as any) ?? {}
      let currentObj: any

      if (Array.isArray(currentRaw)) {
        currentObj = { cities: currentRaw }
      } else if (currentRaw && typeof currentRaw === 'object') {
        currentObj = currentRaw
      } else {
        currentObj = {}
      }

      const nextCities = {
        ...currentObj,
        ...body,
        position: body.position || currentObj.position,
      }

      await prisma.escortProfile.upsert({
        where: { userId },
        update: { cities: nextCities },
        create: { userId, cities: nextCities },
      })

      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Metodo non consentito' })
  } catch (err) {
    console.error('API /api/profile/citta errore:', err)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
