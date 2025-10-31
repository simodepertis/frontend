import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export const config = {
  api: {
    bodyParser: false,
  },
}

function getUserId(req: NextApiRequest): number | null {
  const auth = req.headers.authorization
  const token = auth?.startsWith('Bearer ') ? auth.substring(7) : (req.cookies as any)['auth-token']
  if (!token) return null
  const payload = verifyToken(token)
  return payload?.userId ?? null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo non consentito' })
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Non autenticato' })

  try {
    // Crea documento placeholder (in produzione dovresti salvare il file reale)
    const document = await prisma.document.create({
      data: {
        userId,
        type: 'ID_CARD_FRONT',
        status: 'IN_REVIEW',
        url: 'https://placehold.co/800x600?text=Documento',
      }
    })

    return res.status(200).json({ document })
  } catch (err) {
    console.error('API /api/escort/documents/upload errore:', err)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
