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
  try {
    const token = getBearerToken(req)
    if (!token) return res.status(401).json({ error: 'Non autenticato' })
    const payload = verifyToken(token)
    if (!payload) return res.status(401).json({ error: 'Token non valido' })

    // Optional: enforce role check if available via DB (fallback: allow)
    // const me = await prisma.user.findUnique({ where: { id: payload.userId }, select: { ruolo: true } })
    // if (me?.ruolo !== 'agency' && me?.ruolo !== 'admin') return res.status(403).json({ error: 'Solo agenzie o admin' })

    if (req.method === 'GET') {
      const items = await prisma.escortProfile.findMany({
        where: { agencyId: payload.userId },
        include: { user: { select: { id: true, nome: true, email: true, slug: true, createdAt: true } } },
        orderBy: { updatedAt: 'desc' }
      })
      return res.status(200).json({ items })
    }

    if (req.method === 'POST') {
      const { escortUserId } = req.body || {}
      const uid = Number(escortUserId)
      if (!Number.isFinite(uid) || uid <= 0) return res.status(400).json({ error: 'escortUserId mancante' })

      // Check user exists and is escort
      const escort = await prisma.user.findUnique({ where: { id: uid }, select: { id: true, ruolo: true } })
      if (!escort) return res.status(404).json({ error: 'Utente non trovato' })
      // Allow link anche se ruolo non è "escort" per casi legacy, ma preveniamo se è agency
      if (escort.ruolo === 'agency') return res.status(400).json({ error: 'Non puoi collegare un profilo agenzia' })

      // Ensure not already linked to another agency
      const existing = await prisma.escortProfile.findUnique({ where: { userId: uid } })
      if (existing && existing.agencyId && existing.agencyId !== payload.userId) {
        return res.status(409).json({ error: 'Questa escort è già collegata a un’altra agenzia' })
      }

      const linked = await prisma.escortProfile.upsert({
        where: { userId: uid },
        update: { agencyId: payload.userId },
        create: { userId: uid, agencyId: payload.userId }
      })

      return res.status(200).json({ linked: true, profile: linked })
    }

    if (req.method === 'DELETE') {
      const uid = Number(req.query.escortUserId)
      if (!Number.isFinite(uid) || uid <= 0) return res.status(400).json({ error: 'escortUserId mancante' })

      const prof = await prisma.escortProfile.findUnique({ where: { userId: uid } })
      if (!prof || prof.agencyId !== payload.userId) {
        return res.status(404).json({ error: 'Profilo non collegato a questa agenzia' })
      }

      const updated = await prisma.escortProfile.update({ where: { userId: uid }, data: { agencyId: null } })
      return res.status(200).json({ unlinked: true, profile: updated })
    }

    res.setHeader('Allow', 'GET,POST,DELETE')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    console.error('❌ API /api/agency/escorts errore', e)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
