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

  console.log('📋 API /api/credits/orders chiamata (Pages Router)')
  
  try {
    // Prendi token dall'header Authorization o dai cookies
    const authHeader = req.headers.authorization
    let token = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else {
      token = req.cookies['auth-token']
    }
    
    if (!token) {
      console.log('❌ Nessun token trovato')
      return res.status(401).json({ error: 'Non autenticato' })
    }

    const payload = verifyToken(token)
    if (!payload) {
      console.log('❌ Token non valido')
      return res.status(401).json({ error: 'Token non valido' })
    }

    const orders = await prisma.creditOrder.findMany({ 
      where: { userId: payload.userId }, 
      orderBy: { createdAt: 'desc' }, 
      take: 50 
    });
    
    console.log(`✅ Trovati ${orders.length} ordini per utente ${payload.userId}`)
    return res.status(200).json({ orders });
  } catch (error: unknown) {
    console.error('❌ ERRORE in /api/credits/orders:', error)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
