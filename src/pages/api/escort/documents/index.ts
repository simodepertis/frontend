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
      const documents = await prisma.document.findMany({ where: { userId } })
      return res.status(200).json({ documents })
    }

    return res.status(405).json({ error: 'Metodo non consentito' })
  } catch (err) {
    console.error('API /api/escort/documents errore:', err)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
