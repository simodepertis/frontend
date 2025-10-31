import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { hashPassword, validateEmail, validatePassword, generateToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo non consentito' })
  try {
    const { email, password, nome, ruolo } = req.body || {}

    if (!email || !password || !nome) {
      return res.status(400).json({ error: 'Dati mancanti' })
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Email non valida' })
    }
    const pw = validatePassword(password)
    if (!pw.isValid) {
      return res.status(400).json({ error: pw.errors.join(' • ') })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ error: 'Email già registrata' })
    }

    const hashed = await hashPassword(password)
    const created = await prisma.user.create({
      data: {
        email,
        password: hashed,
        nome: nome || 'Utente',
        ruolo: ruolo === 'escort' || ruolo === 'agency' || ruolo === 'admin' ? ruolo : 'user',
      }
    })

    const token = generateToken(created.id, created.email)
    return res.status(201).json({
      user: { id: created.id, email: created.email, nome: created.nome, ruolo: created.ruolo },
      token
    })
  } catch (err) {
    console.error('Errore /api/register:', err)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
