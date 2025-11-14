import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Non autenticato' })
    const payload = verifyToken(token)
    if (!payload) return res.status(401).json({ error: 'Token non valido' })

    const items = await prisma.quickMeeting.findMany({
      where: { userId: payload.userId ?? -1 },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, city: true, publishedAt: true }
    })
    return res.json({ items })
  } catch (e) {
    return res.status(500).json({ error: 'Errore interno' })
  }
}
