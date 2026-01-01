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

    // GET: lista escort collegate all'agenzia
    if (req.method === 'GET') {
      const escorts = await prisma.escortProfile.findMany({
        where: { agencyId: payload.userId },
        include: { user: { select: { id: true, nome: true, email: true } } },
        orderBy: { updatedAt: 'desc' },
      })
      return res.status(200).json({ escorts })
    }

    // PATCH: link/unlink tramite userId dell'escort
    if (req.method === 'PATCH') {
      const { escortUserId, action } = req.body || {}
      const uid = Number(escortUserId)
      if (!Number.isFinite(uid) || uid <= 0) return res.status(400).json({ error: 'escortUserId obbligatorio' })
      if (action !== 'link' && action !== 'unlink') return res.status(400).json({ error: 'action non valida' })

      const prof = await prisma.escortProfile.findUnique({ where: { userId: uid } })
      if (!prof) {
        // se non esiste profilo, permettiamo link creando il profilo solo se l'utente esiste ed è escort
        const u = await prisma.user.findUnique({ where: { id: uid }, select: { id: true, ruolo: true, suspended: true } })
        if (!u || u.suspended) return res.status(404).json({ error: 'Utente escort non trovato' })
        if (u.ruolo !== 'escort') return res.status(400).json({ error: 'Questo utente non è un profilo escort' })

        if (action === 'unlink') return res.status(400).json({ error: 'Escort non collegata' })

        await prisma.escortProfile.create({ data: { userId: uid, agencyId: payload.userId } })
        return res.status(200).json({ ok: true })
      }

      if (action === 'link') {
        if (prof.agencyId && prof.agencyId !== payload.userId) {
          return res.status(409).json({ error: 'Questa escort è già collegata ad un\'altra agenzia' })
        }
        await prisma.escortProfile.update({ where: { userId: uid }, data: { agencyId: payload.userId } })
        return res.status(200).json({ ok: true })
      }

      // unlink
      if (prof.agencyId !== payload.userId) {
        return res.status(403).json({ error: 'Questa escort non è collegata alla tua agenzia' })
      }
      await prisma.escortProfile.update({ where: { userId: uid }, data: { agencyId: null } })
      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', 'GET,PATCH')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    console.error('❌ /api/agency/escorts errore', e)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
