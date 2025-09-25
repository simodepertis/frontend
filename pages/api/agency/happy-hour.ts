import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function getBearerToken(req: NextApiRequest): string | null {
  const auth = (req.headers.authorization || (req.headers as any).Authorization) as string | undefined
  if (auth && typeof auth === 'string' && auth.startsWith('Bearer ')) return auth.slice(7)
  const cookie = req.cookies['auth-token']
  return cookie || null
}

type HHItem = { escortUserId: number; range: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = getBearerToken(req)
    if (!token) return res.status(401).json({ error: 'Non autenticato' })
    const payload = verifyToken(token)
    if (!payload) return res.status(401).json({ error: 'Token non valido' })

    const profile = await prisma.agencyProfile.findUnique({ where: { userId: payload.userId } })
    const socials = (profile?.socials as any) || {}
    const list: HHItem[] = Array.isArray(socials.happyHour) ? socials.happyHour : []

    if (req.method === 'GET') {
      return res.status(200).json({ items: list })
    }

    if (req.method === 'POST') {
      const { escortUserId, range } = req.body || {}
      const id = Number(escortUserId)
      if (!Number.isFinite(id) || id <= 0 || typeof range !== 'string' || !range.trim()) {
        return res.status(400).json({ error: 'Parametri non validi' })
      }
      const next = [...list.filter(x => x.escortUserId !== id), { escortUserId: id, range: String(range).trim() }]
      const updated = await prisma.agencyProfile.upsert({
        where: { userId: payload.userId },
        update: { socials: { ...(socials || {}), happyHour: next } },
        create: { userId: payload.userId, socials: { happyHour: next } }
      })
      return res.status(200).json({ saved: true, items: (updated.socials as any)?.happyHour || [] })
    }

    if (req.method === 'DELETE') {
      const id = Number(req.query.escortUserId)
      const next = list.filter(x => x.escortUserId !== id)
      const updated = await prisma.agencyProfile.upsert({
        where: { userId: payload.userId },
        update: { socials: { ...(socials || {}), happyHour: next } },
        create: { userId: payload.userId, socials: { happyHour: next } }
      })
      return res.status(200).json({ removed: true, items: (updated.socials as any)?.happyHour || [] })
    }

    res.setHeader('Allow', 'GET,POST,DELETE')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    console.error('❌ API /api/agency/happy-hour errore', e)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
