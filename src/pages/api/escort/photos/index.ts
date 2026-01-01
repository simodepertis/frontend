import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function getUserId(req: NextApiRequest): number | null {
  const auth = req.headers.authorization
  const token = auth?.startsWith('Bearer ') ? auth.substring(7) : (req.cookies as any)['auth-token']
  if (!token) return null
  const payload = verifyToken(token)
  return payload?.userId ?? null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Non autenticato' })

  try {
    if (req.method === 'GET') {
      const photos = await prisma.photo.findMany({ where: { userId } })
      return res.status(200).json({ photos })
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {}
      if (!id) return res.status(400).json({ error: 'ID richiesto' })
      const deleted = await prisma.photo.deleteMany({ where: { id: Number(id), userId } })
      if (!deleted.count) return res.status(404).json({ error: 'Foto non trovata' })
      return res.status(200).json({ ok: true, deleted: deleted.count })
    }

    if (req.method === 'PATCH') {
      const { id, isFace, status } = req.body || {}
      if (!id) return res.status(400).json({ error: 'ID richiesto' })
      const data: any = {}
      if (typeof isFace === 'boolean') data.isFace = isFace
      if (typeof status === 'string') data.status = status as any
      const updated = await prisma.photo.update({ where: { id: Number(id) }, data })
      return res.status(200).json({ photo: updated })
    }

    return res.status(405).json({ error: 'Metodo non consentito' })
  } catch (err) {
    console.error('API /api/escort/photos errore:', err)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
