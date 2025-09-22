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
    const documents = await prisma.document.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 100 })
    return res.json({ documents })
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {}
    const num = Number(id || 0)
    if (!num) return res.status(400).json({ error: 'ID non valido' })
    const d = await prisma.document.findUnique({ where: { id: num } })
    if (!d || d.userId !== user.id) return res.status(404).json({ error: 'Non trovato' })
    if (d.status !== 'IN_REVIEW') {
      await prisma.document.delete({ where: { id: num } })
    }
    return res.json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
