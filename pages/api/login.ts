import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  console.log('🔐 API /api/login chiamata')
  
  try {
    const { email, password } = req.body

    // Validazione input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e password sono obbligatori' })
    }

    // Trova utente
    const user = await prisma.user.findUnique({ 
      where: { email },
      select: { id: true, nome: true, email: true, password: true, ruolo: true }
    })

    if (!user) {
      return res.status(401).json({ error: 'Credenziali non valide' })
    }

    // Verifica password
    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return res.status(401).json({ error: 'Credenziali non valide' })
    }

    // Genera token
    const token = generateToken(user.id, user.email)

    // Rimuovi password dalla risposta
    const { password: _, ...userWithoutPassword } = user

    return res.status(200).json({
      message: 'Login effettuato con successo',
      user: userWithoutPassword,
      token
    })
  } catch (error: unknown) {
    console.error('❌ ERRORE nel login:', error)
    return res.status(500).json({ error: 'Errore interno del server' })
  }
}
