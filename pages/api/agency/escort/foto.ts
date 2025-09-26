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
    const photos = await prisma.photo.findMany({ where: { userId: escortUserId }, orderBy: { createdAt: 'desc' } })
    return res.json({ photos })
  }

  if (req.method === 'POST') {
    const { url, name, size } = req.body || {}
    if (!url || !name || typeof size !== 'number') return res.status(400).json({ error: 'Dati mancanti' })
    const created = await prisma.photo.create({ data: { userId: escortUserId, url, name, size, status: 'DRAFT' as any } })
    return res.json({ photo: created })
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {}
    const photoId = Number(id || 0)
    if (!photoId) return res.status(400).json({ error: 'ID mancante' })
    const p = await prisma.photo.findUnique({ where: { id: photoId } })
    if (!p || p.userId !== escortUserId) return res.status(404).json({ error: 'Non trovato' })
    await prisma.photo.delete({ where: { id: photoId } })
    return res.json({ ok: true })
  }

  if (req.method === 'PATCH') {
    const { id, isFace, action } = req.body || {}
    const photoId = Number(id || 0)
    if (!photoId) return res.status(400).json({ error: 'Parametri non validi' })
    const p = await prisma.photo.findUnique({ where: { id: photoId } })
    if (!p || p.userId !== escortUserId) return res.status(404).json({ error: 'Non trovato' })
    const data: any = {}
    if (typeof isFace === 'boolean') data.isFace = !!isFace
    if (action === 'submit') data.status = 'IN_REVIEW'
    const updated = await prisma.photo.update({ where: { id: photoId }, data })
    return res.json({ ok: true, photo: updated })
  }

  res.setHeader('Allow', 'GET,POST,DELETE,PATCH')
  return res.status(405).json({ error: 'Method not allowed' })
}
