import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function getBearerToken(req: NextApiRequest): string | null {
  const auth = req.headers.authorization || req.headers.Authorization as string | undefined
  if (auth && typeof auth === 'string' && auth.startsWith('Bearer ')) return auth.slice(7)
  // cookie fallback
  const cookie = req.cookies['auth-token']
  return cookie || null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = getBearerToken(req)
    if (!token) return res.status(401).json({ error: 'Non autenticato' })
    const payload = verifyToken(token)
    if (!payload) return res.status(401).json({ error: 'Token non valido' })

    if (req.method === 'GET') {
      const prof = await prisma.agencyProfile.findUnique({ where: { userId: payload.userId } })
      return res.status(200).json({ profile: prof || null })
    }

    if (req.method === 'PATCH') {
      const { name, description, languages, cities, services, contacts, website, socials } = req.body || {}
      const updated = await prisma.agencyProfile.upsert({
        where: { userId: payload.userId },
        update: {
          name: typeof name === 'string' ? name : undefined,
          description: typeof description === 'string' ? description : undefined,
          languages: languages ?? undefined,
          cities: cities ?? undefined,
          services: services ?? undefined,
          contacts: contacts ?? undefined,
          website: typeof website === 'string' ? website : undefined,
          socials: socials ?? undefined,
        },
        create: {
          userId: payload.userId,
          name: typeof name === 'string' ? name : null,
          description: typeof description === 'string' ? description : null,
          languages: languages ?? null,
          cities: cities ?? null,
          services: services ?? null,
          contacts: contacts ?? null,
          website: typeof website === 'string' ? website : null,
          socials: socials ?? null,
        }
      })
      return res.status(200).json({ profile: updated })
    }

    res.setHeader('Allow', 'GET,PATCH')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    console.error('❌ API /api/agency/profile errore', e)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
