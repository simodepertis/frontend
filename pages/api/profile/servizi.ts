import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Non autenticato' })
  const payload = verifyToken(token)
  if (!payload) return res.status(401).json({ error: 'Token non valido' })

  if (req.method === 'GET') {
    const prof = await prisma.escortProfile.findUnique({ where: { userId: payload.userId } })
    return res.json({ services: prof?.services || null })
  }

  if (req.method === 'PATCH') {
    const services = req.body?.services
    if (!services) return res.status(400).json({ error: 'Payload mancante' })
    const prof = await prisma.escortProfile.upsert({
      where: { userId: payload.userId },
      update: { services },
      create: { userId: payload.userId, services },
    })
    return res.json({ ok: true, services: prof.services })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
