import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function getUserId(req: NextApiRequest): number | null {
  const auth = req.headers.authorization
  const token = auth?.startsWith('Bearer ') ? auth.substring(7) : (req.cookies as any)['auth-token']
  if (!token) return null
  const payload = verifyToken(token)
  return payload?.userId ?? null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Non autenticato' })

  try {
    if (req.method === 'GET') {
      // Leggi stato consenso
      const profile = await prisma.escortProfile.findUnique({ 
        where: { userId } 
      })
      return res.status(200).json({ 
        consentAcceptedAt: profile?.consentAcceptedAt || null 
      })
    }

    if (req.method === 'PATCH') {
      // Registra consenso
      const now = new Date()
      await prisma.escortProfile.upsert({
        where: { userId },
        update: { consentAcceptedAt: now },
        create: { userId, consentAcceptedAt: now }
      })
      return res.status(200).json({ 
        consentAcceptedAt: now.toISOString() 
      })
    }

    return res.status(405).json({ error: 'Metodo non consentito' })
  } catch (err) {
    console.error('API /api/escort/consent errore:', err)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
