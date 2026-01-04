import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

async function requireUser(req: NextApiRequest) {
  const auth = req.headers.authorization || ''
  const raw = auth.startsWith('Bearer ') ? auth.slice(7) : ''
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
    const photos = await prisma.photo.findMany({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' } })
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

  if (req.method === 'PATCH') {
    const { id, isFace, setAsCover, reorderIds } = req.body || {}

    // Riordino persistente: usa updatedAt (già usato per cover e ordinamento pubblico)
    if (Array.isArray(reorderIds) && reorderIds.length > 0) {
      const ids = reorderIds.map((x: any) => Number(x)).filter((n: any) => Number.isFinite(n) && n > 0)
      if (ids.length !== reorderIds.length) return res.status(400).json({ error: 'Parametri non validi' })

      const owned = await prisma.photo.findMany({ where: { userId: user.id, id: { in: ids } }, select: { id: true } })
      if (owned.length !== ids.length) return res.status(403).json({ error: 'Non autorizzato' })

      const base = Date.now()
      await prisma.$transaction(
        ids.map((photoId: number, idx: number) =>
          prisma.photo.update({
            where: { id: photoId },
            data: { updatedAt: new Date(base - idx) },
          })
        )
      )

      const photos = await prisma.photo.findMany({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' } })
      return res.json({ ok: true, photos })
    }

    const photoId = Number(id || 0)
    if (!photoId) return res.status(400).json({ error: 'Parametri non validi' })
    const p = await prisma.photo.findUnique({ where: { id: photoId } })
    if (!p || p.userId !== user.id) return res.status(404).json({ error: 'Non trovato' })

    if (typeof setAsCover === 'boolean' && setAsCover === true) {
      const updated = await prisma.photo.update({
        where: { id: photoId },
        data: { name: p.name, updatedAt: new Date() },
      })
      return res.json({ ok: true, photo: updated })
    }

    if (typeof isFace !== 'boolean') return res.status(400).json({ error: 'Parametri non validi' })
    const updated = await prisma.photo.update({ where: { id: photoId }, data: { isFace } })
    return res.json({ ok: true, photo: updated })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
