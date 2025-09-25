import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
    const auth = req.headers.authorization || ''
    const raw = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7) : ''
    if (!raw) return res.status(401).json({ error: 'Non autenticato' })
    const payload = verifyToken(raw)
    if (!payload) return res.status(401).json({ error: 'Token non valido' })

    const escortUserId = Number(req.query.escortUserId || 0)
    if (!escortUserId) return res.status(400).json({ error: 'escortUserId obbligatorio' })

    const prof = await prisma.escortProfile.findUnique({ where: { userId: escortUserId } })
    if (!prof || prof.agencyId !== payload.userId) return res.status(403).json({ error: 'Escort non collegata alla tua agenzia' })

    let wallet = await prisma.creditWallet.findUnique({ where: { userId: escortUserId } })
    if (!wallet) wallet = await prisma.creditWallet.create({ data: { userId: escortUserId, balance: 0 } })

    return res.json({ wallet })
  } catch (e:any) {
    console.error('agency credits wallet error', e)
    return res.status(500).json({ error: e?.message || 'Errore interno' })
  }
}
