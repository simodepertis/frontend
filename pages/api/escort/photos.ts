import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

async function requireUser(req: NextApiRequest) {
  const raw = getTokenFromRequest(req as any)
  if (!raw) return null
  const payload = verifyToken(raw)
  if (!payload) return null
  const u = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!u) return null
  return u
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireUser(req)
  if (!user) return res.status(401).json({ error: 'Non autenticato' })

  if (req.method === 'GET') {
    const photos = await prisma.photo.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } })
    return res.json({ photos })
  }

  if (req.method === 'POST') {
    const { url, name, size } = req.body || {}
    if (!url || !name || typeof size !== 'number') return res.status(400).json({ error: 'Dati mancanti' })
    const created = await prisma.photo.create({ data: { userId: user.id, url, name, size } })
    return res.json({ photo: created })
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {}
    if (!id) return res.status(400).json({ error: 'ID mancante' })
    const p = await prisma.photo.findUnique({ where: { id } })
    if (!p || p.userId !== user.id) return res.status(404).json({ error: 'Non trovato' })
    await prisma.photo.delete({ where: { id } })
    return res.json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
