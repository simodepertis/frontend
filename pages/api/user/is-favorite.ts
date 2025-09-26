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

  const token = getBearerToken(req)
  if (!token) return res.json({ isFavorite: false }) // Non autenticato = non nei preferiti

  const payload = verifyToken(token)
  if (!payload) return res.json({ isFavorite: false })

  const { targetUserId } = req.query
  if (!targetUserId || !Number.isInteger(Number(targetUserId))) {
    return res.status(400).json({ error: 'targetUserId richiesto' })
  }

  const favorite = await prisma.favorite.findUnique({
    where: {
      userId_targetUserId: {
        userId: payload.userId,
        targetUserId: Number(targetUserId)
      }
    }
  })

  return res.json({ isFavorite: !!favorite })
}
