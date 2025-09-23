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
    return res.json({ contacts: prof?.contacts || null })
  }

  if (req.method === 'PATCH') {
    const { phone, apps, note, emailBooking, website, noAnonymous } = req.body || {}
    const contacts = {
      phone: String(phone || ''),
      apps: Array.isArray(apps) ? apps : [],
      note: note ? String(note) : '',
      emailBooking: emailBooking ? String(emailBooking) : '',
      website: website ? String(website) : '',
      noAnonymous: !!noAnonymous,
    }
    const prof = await prisma.escortProfile.upsert({
      where: { userId: payload.userId },
      update: { contacts },
      create: { userId: payload.userId, contacts },
    })
    return res.json({ ok: true, contacts: prof.contacts })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
