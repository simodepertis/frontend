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

  console.log('💰 API /api/credits/wallet chiamata (Pages Router)')
  
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
      return res.status(401).json({ error: 'Non autenticato' })
    }

    // Verifica token
    const payload = verifyToken(token)
    if (!payload) {
      console.log('❌ Token non valido')
      return res.status(401).json({ error: 'Token non valido' })
    }

    let w = await prisma.creditWallet.findUnique({ where: { userId: payload.userId } });
    if (!w) {
      w = await prisma.creditWallet.create({ data: { userId: payload.userId, balance: 0 } });
      console.log(`💰 Wallet creato per utente ${payload.userId}`)
    }
    
    console.log(`✅ Wallet trovato: ${w.balance} crediti`)
    return res.status(200).json({ wallet: { balance: w.balance } });
  } catch (error: unknown) {
    console.error('❌ ERRORE in /api/credits/wallet:', error)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
