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

    const escortUserId = Number((req.method === 'GET' ? req.query.escortUserId : (req.body || {}).escortUserId))
    if (!Number.isFinite(escortUserId) || escortUserId <= 0) {
      return res.status(400).json({ error: 'escortUserId obbligatorio' })
    }

    // Verifica che la escort sia collegata all'agenzia richiedente
    const prof = await prisma.escortProfile.findUnique({ where: { userId: escortUserId } })
    if (!prof || prof.agencyId !== payload.userId) {
      return res.status(403).json({ error: 'Questa escort non è collegata alla tua agenzia' })
    }

    if (req.method === 'GET') {
      const contacts = (prof.contacts as any) || {}
      return res.json({ bioIt: prof.bioIt || '', info: contacts.bioInfo || null })
    }

    if (req.method === 'PATCH') {
      const { bioIt, info } = req.body || {}
      const updated = await prisma.escortProfile.update({
        where: { userId: escortUserId },
        data: {
          bioIt: bioIt ?? undefined,
          contacts: (await (async () => {
            const base = (prof.contacts as any) || {}
            return info ? { ...base, bioInfo: info } : base
          })()) as any,
        },
      })
      return res.json({ ok: true, bioIt: updated.bioIt, info: (updated.contacts as any)?.bioInfo || null })
    }

    res.setHeader('Allow', 'GET,PATCH')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    console.error('❌ /api/agency/escort/biografia errore', e)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
