import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { slug } = req.query
    if (!slug || typeof slug !== 'string') return res.status(400).json({ error: 'Slug mancante' })

    const user = await prisma.user.findUnique({ where: { slug } })
    if (!user) return res.status(404).json({ error: 'Profilo non trovato' })

    const take = Math.min(Number(req.query.take) || 20, 50)
    const skip = Math.max(Number(req.query.skip) || 0, 0)

    const items = await prisma.review.findMany({
      where: { targetUserId: user.id, status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      include: { author: { select: { id: true, nome: true } } }
    })

    const total = await prisma.review.count({ where: { targetUserId: user.id, status: 'APPROVED' } })
    return res.json({ items, total })
  } catch (e) {
    return res.status(500).json({ error: 'Errore interno' })
  }
}
