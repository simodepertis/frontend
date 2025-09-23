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
    const contacts = (prof?.contacts as any) || {}
    return res.json({ workingHours: contacts.workingHours || null })
  }

  if (req.method === 'PATCH') {
    const { workingHours } = req.body || {}
    if (!workingHours) return res.status(400).json({ error: 'Payload mancante' })
    const current = await prisma.escortProfile.findUnique({ where: { userId: payload.userId } })
    const contacts = { ...(current?.contacts as any) } || {}
    contacts.workingHours = workingHours
    const prof = await prisma.escortProfile.upsert({
      where: { userId: payload.userId },
      update: { contacts: contacts as any },
      create: { userId: payload.userId, contacts: contacts as any },
    })
    return res.json({ ok: true, workingHours: (prof.contacts as any).workingHours })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
