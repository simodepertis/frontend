import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo non consentito' })
  try {
    const { email, password, expectedRole } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e password sono richieste' })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Credenziali non valide' })
    }

    const ok = await verifyPassword(password, user.password)
    if (!ok) {
      return res.status(401).json({ error: 'Credenziali non valide' })
    }

    // Se specificato, controlla che il ruolo corrisponda
    if (expectedRole && user.ruolo && user.ruolo !== expectedRole) {
      // Consenti comunque l'accesso ma segnala il ruolo corrente
      // oppure blocca; qui preferiamo consentire per UX
    }

    const token = generateToken(user.id, user.email)

    // Opzionale: set cookie oltre al JSON
    res.setHeader('Set-Cookie', `auth-token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60*60*24*7}`)

    return res.status(200).json({
      token,
      user: { id: user.id, email: user.email, nome: user.nome, ruolo: user.ruolo }
    })
  } catch (err) {
    console.error('Errore /api/login:', err)
    return res.status(500).json({ error: 'Errore interno del server' })
  }
}
