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
    if (!Number.isFinite(escortUserId) || escortUserId <= 0) return res.status(400).json({ error: 'escortUserId obbligatorio' })

    const prof = await prisma.escortProfile.findUnique({ where: { userId: escortUserId } })
    if (!prof || prof.agencyId !== payload.userId) return res.status(403).json({ error: 'Questa escort non è collegata alla tua agenzia' })

    if (req.method === 'GET') {
      const documents = await prisma.document.findMany({ where: { userId: escortUserId }, orderBy: { createdAt: 'desc' } })
      return res.json({ documents })
    }

    if (req.method === 'POST') {
      const { type, url } = req.body || {}
      const types = ['ID_CARD_FRONT','ID_CARD_BACK','SELFIE_WITH_ID']
      if (!types.includes(String(type)) || !url) return res.status(400).json({ error: 'Dati mancanti' })
      const created = await prisma.document.create({ data: { userId: escortUserId, type: type as any, url: String(url), status: 'DRAFT' as any } })
      return res.json({ document: created })
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {}
      const docId = Number(id || 0)
      if (!docId) return res.status(400).json({ error: 'ID mancante' })
      const d = await prisma.document.findUnique({ where: { id: docId } })
      if (!d || d.userId !== escortUserId) return res.status(404).json({ error: 'Non trovato' })
      await prisma.document.delete({ where: { id: docId } })
      return res.json({ ok: true })
    }

    res.setHeader('Allow', 'GET,POST,DELETE')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    console.error('❌ /api/agency/escort/documenti errore', e)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
