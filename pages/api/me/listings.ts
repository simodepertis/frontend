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
  try {
    const user = await requireUser(req)
    if (!user) return res.status(401).json({ error: 'Non autenticato' })

    if (req.method === 'GET') {
      const items = await prisma.listing.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      })
      return res.json({ items })
    }

    if (req.method === 'POST') {
      const body = req.body || {}
      const title = String(body.title || '').trim()
      const text = String(body.body || '').trim()
      const city = String(body.city || '').trim()
      const type = String(body.type || 'PHYSICAL').toUpperCase() as any
      if (!title || !text || !city) return res.status(400).json({ error: 'Campi obbligatori mancanti' })

      const created = await prisma.listing.create({
        data: {
          userId: user.id,
          title,
          body: text,
          city,
          type, // 'PHYSICAL' | 'VIRTUAL'
          status: 'IN_REVIEW' as any,
        } as any,
      })
      return res.status(201).json({ ok: true, item: created })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    return res.status(500).json({ error: 'Errore interno' })
  }
}
