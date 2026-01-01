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
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const token = getBearerToken(req)
    if (!token) return res.status(401).json({ error: 'Non autenticato' })
    const payload = verifyToken(token)
    if (!payload) return res.status(401).json({ error: 'Token non valido' })

    const query = String(req.query.query || '').trim()
    if (query.length < 2) return res.status(200).json({ results: [] })

    const results = await prisma.user.findMany({
      where: {
        ruolo: 'escort',
        suspended: false,
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { nome: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
      include: {
        escortProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return res.status(200).json({ results })
  } catch (e) {
    console.error('❌ /api/agency/escorts/search errore', e)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
