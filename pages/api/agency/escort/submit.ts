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
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const token = getBearerToken(req)
    if (!token) return res.status(401).json({ error: 'Non autenticato' })
    const payload = verifyToken(token)
    if (!payload) return res.status(401).json({ error: 'Token non valido' })

    const { escortUserId } = req.body || {}
    const uid = Number(escortUserId)
    if (!Number.isFinite(uid) || uid <= 0) return res.status(400).json({ error: 'escortUserId obbligatorio' })

    const prof = await prisma.escortProfile.findUnique({ where: { userId: uid } })
    if (!prof || prof.agencyId !== payload.userId) return res.status(403).json({ error: 'Questa escort non è collegata alla tua agenzia' })

    // Aggiorna il consenso e manda le foto in revisione
    const updated = await prisma.escortProfile.update({
      where: { userId: uid },
      data: { consentAcceptedAt: new Date() }
    })

    // Manda tutte le foto e video dell'escort in revisione
    await prisma.photo.updateMany({
      where: { userId: uid, status: 'DRAFT' },
      data: { status: 'IN_REVIEW' }
    })

    await prisma.video.updateMany({
      where: { userId: uid, status: 'DRAFT' },
      data: { status: 'IN_REVIEW' }
    })

    return res.status(200).json({ ok: true, message: 'Foto e video inviati in revisione' })
  } catch (e) {
    console.error('❌ /api/agency/escort/submit errore', e)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
