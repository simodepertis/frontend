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
    const videos = await prisma.video.findMany({ where: { userId: escortUserId }, orderBy: { createdAt: 'desc' } })
    return res.json({ videos })
  }

  if (req.method === 'POST') {
    const { url, title, duration, hd, thumb } = req.body || {}
    if (!url || !title) return res.status(400).json({ error: 'Dati mancanti' })
    const created = await prisma.video.create({ data: { userId: escortUserId, url: String(url), title: String(title), duration: duration ? String(duration) : null as any, hd: !!hd, thumb: thumb ? String(thumb) : null as any } })
    return res.json({ video: created })
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {}
    const videoId = Number(id || 0)
    if (!videoId) return res.status(400).json({ error: 'ID mancante' })
    const v = await prisma.video.findUnique({ where: { id: videoId } })
    if (!v || v.userId !== escortUserId) return res.status(404).json({ error: 'Non trovato' })
    await prisma.video.delete({ where: { id: videoId } })
    return res.json({ ok: true })
  }

  if (req.method === 'PATCH') {
    const { id, title, duration, hd, thumb } = req.body || {}
    const videoId = Number(id || 0)
    if (!videoId) return res.status(400).json({ error: 'ID mancante' })
    const v = await prisma.video.findUnique({ where: { id: videoId } })
    if (!v || v.userId !== escortUserId) return res.status(404).json({ error: 'Non trovato' })
    const updated = await prisma.video.update({ where: { id: videoId }, data: {
      title: title !== undefined ? String(title) : undefined,
      duration: duration !== undefined ? String(duration) : undefined,
      hd: typeof hd === 'boolean' ? !!hd : undefined,
      thumb: thumb !== undefined ? String(thumb) : undefined,
    } })
    return res.json({ ok: true, video: updated })
  }

  res.setHeader('Allow', 'GET,POST,DELETE,PATCH')
  return res.status(405).json({ error: 'Method not allowed' })
}
