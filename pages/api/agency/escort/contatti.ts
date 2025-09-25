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
  const token = getBearerToken(req)
  if (!token) return res.status(401).json({ error: 'Non autenticato' })
  const payload = verifyToken(token)
  if (!payload) return res.status(401).json({ error: 'Token non valido' })

  const escortUserId = Number((req.method === 'GET' ? req.query.escortUserId : (req.body || {}).escortUserId))
  if (!Number.isFinite(escortUserId) || escortUserId <= 0) return res.status(400).json({ error: 'escortUserId obbligatorio' })

  const prof = await prisma.escortProfile.findUnique({ where: { userId: escortUserId } })
  if (!prof || prof.agencyId !== payload.userId) return res.status(403).json({ error: 'Questa escort non è collegata alla tua agenzia' })

  if (req.method === 'GET') {
    return res.json({ contacts: prof.contacts || null })
  }

  if (req.method === 'PATCH') {
    const { phone, apps, note, emailBooking, website, noAnonymous } = req.body || {}
    const contacts = {
      ...(prof.contacts as any || {}),
      phone: String(phone ?? (prof as any).contacts?.phone || ''),
      apps: Array.isArray(apps) ? apps : ((prof as any).contacts?.apps || []),
      note: note != null ? String(note) : ((prof as any).contacts?.note || ''),
      emailBooking: emailBooking != null ? String(emailBooking) : ((prof as any).contacts?.emailBooking || ''),
      website: website != null ? String(website) : ((prof as any).contacts?.website || ''),
      noAnonymous: !!(noAnonymous ?? (prof as any).contacts?.noAnonymous),
    }
    const updated = await prisma.escortProfile.update({ where: { userId: escortUserId }, data: { contacts } })
    return res.json({ ok: true, contacts: updated.contacts })
  }

  res.setHeader('Allow', 'GET,PATCH')
  return res.status(405).json({ error: 'Method not allowed' })
}
