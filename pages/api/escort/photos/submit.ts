import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Non autenticato' })
    const payload = verifyToken(token)
    if (!payload) return res.status(401).json({ error: 'Token non valido' })

    const photos = await prisma.photo.findMany({ where: { userId: payload.userId } })
    const total = photos.length
    const faces = photos.filter(p => (p as any).isFace === true).length

    if (total < 3) return res.status(400).json({ error: 'Devi caricare almeno 3 foto' })
    if (faces < 1) return res.status(400).json({ error: 'Devi selezionare almeno una foto con il volto' })

    await prisma.photo.updateMany({ where: { userId: payload.userId }, data: { status: 'IN_REVIEW' as any } })

    return res.json({ ok: true, submitted: total })
  } catch (e) {
    return res.status(500).json({ error: 'Errore interno' })
  }
}
