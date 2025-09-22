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

    const tx = await prisma.creditTransaction.findMany({ where: { userId: payload.userId }, orderBy: { createdAt: 'desc' }, take: 100 })
    return res.json({ transactions: tx })
  } catch (e) {
    return res.status(500).json({ error: 'Errore interno' })
  }
}
