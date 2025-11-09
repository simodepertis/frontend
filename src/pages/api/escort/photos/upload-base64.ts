import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// Dedicated endpoint to accept JSON with data URL (base64) reliably
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb'
    }
  }
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
    const { url, name, size } = req.body || {}
    if (!url || !name || typeof url !== 'string' || !url.startsWith('data:')) {
      return res.status(400).json({ error: 'URL base64 (data:) e nome richiesti' })
    }

    const photo = await prisma.photo.create({
      data: {
        userId,
        url,
        name,
        size: Number(size) || url.length,
        status: 'DRAFT',
        isFace: false,
      }
    })

    return res.status(200).json({ photo })
  } catch (err: any) {
    console.error('❌ API /api/escort/photos/upload-base64 errore:', err?.message || err)
    return res.status(500).json({ error: err?.message || 'Errore interno' })
  }
}
