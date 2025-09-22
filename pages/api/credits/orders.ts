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

    const orders = await prisma.creditOrder.findMany({ where: { userId: payload.userId }, orderBy: { createdAt: 'desc' }, take: 50 })
    return res.json({ orders })
  } catch (e) {
    return res.status(500).json({ error: 'Errore interno' })
  }
}
