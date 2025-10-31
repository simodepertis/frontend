import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export const config = {
  api: {
    bodyParser: false, // Non analizziamo form-data (non serve il file per questo test)
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
    // Creiamo un record Photo senza salvare realmente il file (placeholder URL)
    const photo = await prisma.photo.create({
      data: {
        userId,
        url: 'https://placehold.co/600x800?text=Foto',
        name: 'upload.jpg',
        size: 0,
        status: 'DRAFT',
        isFace: false,
      } as any,
    })

    return res.status(200).json({ photo })
  } catch (err) {
    console.error('API /api/escort/photos/upload errore:', err)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
