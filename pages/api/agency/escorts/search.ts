import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function getBearerToken(req: NextApiRequest): string | null {
  const auth = (req.headers.authorization || (req.headers as any).Authorization) as string | undefined
  if (auth && typeof auth === 'string' && auth.startsWith('Bearer ')) return auth.slice(7)
  const cookie = req.cookies['auth-token']
  return cookie || null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = getBearerToken(req)
    if (!token) return res.status(401).json({ error: 'Non autenticato' })
    const payload = verifyToken(token)
    if (!payload) return res.status(401).json({ error: 'Token non valido' })

    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET')
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const q = String(req.query.q || '').trim().toLowerCase()
    if (!q) return res.status(200).json({ items: [] })

    const items = await prisma.user.findMany({
      where: {
        OR: [
          { nome: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
        ],
        ruolo: { in: ['escort','user'] } // consenti collegamento anche a utenti che diventeranno escort
      },
      select: { id: true, nome: true, email: true, slug: true },
      take: 20,
      orderBy: { id: 'desc' }
    })

    return res.status(200).json({ items })
  } catch (e) {
    console.error('❌ API /api/agency/escorts/search errore', e)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
