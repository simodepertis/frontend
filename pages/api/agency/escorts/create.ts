import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { hashPassword, validateEmail, verifyToken } from '@/lib/auth'

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

    const { nome, email, password } = req.body || {}
    if (!nome || !email || !password) return res.status(400).json({ error: 'Nome, email e password sono obbligatori' })
    if (!validateEmail(email)) return res.status(400).json({ error: 'Email non valida' })
    if (String(password).length < 6) return res.status(400).json({ error: 'Password troppo corta' })

    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) return res.status(409).json({ error: 'Email già registrata' })

    const hashed = await hashPassword(String(password))

    const user = await prisma.user.create({
      data: { nome: String(nome), email: String(email).toLowerCase(), password: hashed, ruolo: 'escort' },
      select: { id: true, nome: true, email: true, ruolo: true }
    })

    // crea o collega profilo escort all'agenzia corrente
    await prisma.escortProfile.upsert({
      where: { userId: user.id },
      update: { agencyId: payload.userId },
      create: { userId: user.id, agencyId: payload.userId }
    })

    return res.status(201).json({ created: true, userId: user.id })
  } catch (e) {
    console.error('❌ /api/agency/escorts/create errore', e)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
