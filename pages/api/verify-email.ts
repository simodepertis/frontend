import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { sha256Hex } from '@/lib/resend'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = typeof req.query.token === 'string' ? req.query.token : ''
  if (!token) {
    return res.status(400).json({ error: 'Token mancante' })
  }

  try {
    const tokenHash = sha256Hex(token)

    const record = await (prisma as any).emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    })

    if (!record) {
      return res.status(400).json({ error: 'Token non valido' })
    }

    if (record.expiresAt.getTime() < Date.now()) {
      await (prisma as any).emailVerificationToken.delete({ where: { tokenHash } }).catch(() => {})
      return res.status(400).json({ error: 'Token scaduto' })
    }

    await prisma.$transaction([
      (prisma as any).user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date() },
      }),
      (prisma as any).emailVerificationToken.delete({ where: { tokenHash } }),
    ])

    return res.status(200).json({ ok: true })
  } catch (error: unknown) {
    console.error('❌ ERRORE verify-email:', error)
    return res.status(500).json({ error: 'Errore interno del server' })
  }
}
