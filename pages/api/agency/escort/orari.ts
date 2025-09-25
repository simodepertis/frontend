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

  const current = await prisma.escortProfile.findUnique({ where: { userId: escortUserId } })
  if (!current || current.agencyId !== payload.userId) return res.status(403).json({ error: 'Questa escort non è collegata alla tua agenzia' })

  if (req.method === 'GET') {
    const contacts = (current.contacts as any) || {}
    return res.json({ workingHours: contacts.workingHours || null })
  }

  if (req.method === 'PATCH') {
    const { workingHours } = (req.body || {})
    if (!workingHours) return res.status(400).json({ error: 'Payload mancante' })
    const contacts = { ...(current.contacts as any) } || {}
    contacts.workingHours = workingHours
    const updated = await prisma.escortProfile.update({ where: { userId: escortUserId }, data: { contacts: contacts as any } })
    return res.json({ ok: true, workingHours: (updated.contacts as any).workingHours })
  }

  res.setHeader('Allow', 'GET,PATCH')
  return res.status(405).json({ error: 'Method not allowed' })
}
