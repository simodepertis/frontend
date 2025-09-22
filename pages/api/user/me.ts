import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  console.log('👤 API /api/user/me chiamata')
  
  try {
    // Prendi token dall'header Authorization o dai cookies
    const authHeader = req.headers.authorization
    let token = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else {
      // Controlla nei cookies
      token = req.cookies['auth-token']
    }
    
    if (!token) {
      console.log('❌ Nessun token trovato')
      return res.status(401).json({ error: 'Token mancante' })
    }

    // Verifica token
    const decoded = verifyToken(token)
    if (!decoded) {
      console.log('❌ Token non valido')
      return res.status(401).json({ error: 'Token non valido' })
    }

    // Trova utente
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { 
        id: true, 
        nome: true, 
        email: true, 
        ruolo: true, 
        createdAt: true,
        slug: true
      }
    })

    if (!user) {
      console.log('❌ Utente non trovato')
      return res.status(404).json({ error: 'Utente non trovato' })
    }

    console.log('✅ Utente autenticato:', { 
      id: user.id, 
      nome: user.nome, 
      email: user.email, 
      ruolo: user.ruolo 
    })
    return res.status(200).json({ user })
  } catch (error: unknown) {
    console.error('❌ ERRORE in /api/user/me:', error)
    return res.status(500).json({ error: 'Errore interno del server' })
  }
}
