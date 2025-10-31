import type { NextApiRequest, NextApiResponse } from 'next'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const authHeader = req.headers.authorization
    const cookieToken = (req.cookies as any)['auth-token']
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : cookieToken
    if (!token) return res.status(401).json({ error: 'Token mancante' })

    const payload = verifyToken(token)
    if (!payload) return res.status(401).json({ error: 'Token non valido' })

    const user = await prisma.user.findUnique({ where: { email: payload.email } })
    if (!user) return res.status(404).json({ error: 'Utente non trovato' })

    return res.status(200).json({ user: { id: user.id, email: user.email, nome: user.nome, ruolo: user.ruolo } })
  } catch (err) {
    console.error('Errore /api/user/me:', err)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
