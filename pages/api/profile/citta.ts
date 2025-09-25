import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Non autenticato' })
  const payload = verifyToken(token)
  if (!payload) return res.status(401).json({ error: 'Token non valido' })

  if (req.method === 'GET') {
    const prof = await prisma.escortProfile.findUnique({ where: { userId: payload.userId } })
    return res.json({ cities: prof?.cities || null })
  }

  if (req.method === 'PATCH') {
    const body = req.body || {}
    // Preleva record esistente per fare merge e non perdere campi assenti nel body
    const existing = await prisma.escortProfile.findUnique({ where: { userId: payload.userId } })
    const prev: any = (existing?.cities as any) || {}
    const merged: any = {
      ...prev,
      ...body,
      // Mantieni struttura nota e coerente
      baseCity: body.baseCity ?? prev.baseCity ?? '',
      secondCity: body.secondCity ?? prev.secondCity ?? '',
      thirdCity: body.thirdCity ?? prev.thirdCity ?? '',
      fourthCity: body.fourthCity ?? prev.fourthCity ?? '',
      zones: Array.isArray(body.zones) ? body.zones : (Array.isArray(prev.zones) ? prev.zones : []),
      availability: typeof body.availability === 'object' && body.availability !== null ? body.availability : (prev.availability || {}),
      position: (body.position && typeof body.position.lat === 'number' && typeof body.position.lng === 'number')
        ? { lat: body.position.lat, lng: body.position.lng }
        : (prev.position || undefined),
    }
    const prof = await prisma.escortProfile.upsert({
      where: { userId: payload.userId },
      update: { cities: merged },
      create: { userId: payload.userId, cities: merged },
    })
    return res.json({ ok: true, cities: prof.cities })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
