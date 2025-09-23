import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Non autenticato' })
  const payload = verifyToken(token)
  if (!payload) return res.status(401).json({ error: 'Token non valido' })
  const user = await prisma.user.findUnique({ where: { id: payload.userId }, include: { escortProfile: true } })
  if (!user) return res.status(404).json({ error: 'Utente non trovato' })
  return res.json({ user: { id: user.id, email: user.email, ruolo: user.ruolo }, profile: user.escortProfile || null })
}
