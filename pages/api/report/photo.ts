import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { slug, photoUrl, reason } = req.body || {}
    if (!slug || !photoUrl) return res.status(400).json({ error: 'Parametri mancanti' })

    let reporterId: number | null = null
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (token) {
      const payload = verifyToken(token)
      if (payload) reporterId = payload.userId
    }

    const target = await prisma.user.findUnique({ where: { slug: String(slug) } })
    if (!target) return res.status(404).json({ error: 'Profilo non trovato' })

    await prisma.profileEvent.create({
      data: {
        userId: target.id,
        type: 'SAVE',
        meta: { kind: 'REPORT_PHOTO', photoUrl: String(photoUrl), reason: String(reason || ''), reporterId },
      }
    })

    return res.json({ ok: true })
  } catch (e) {
    console.error('report/photo error', e)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
