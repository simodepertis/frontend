import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

// Aumenta il limite del body JSON per permettere data URL base64
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
    const { photos } = req.body || {}
    
    if (!photos || !Array.isArray(photos)) {
      return res.status(400).json({ error: 'Array foto mancante' })
    }
    
    if (photos.length < 3) {
      return res.status(400).json({ error: 'Devi caricare almeno 3 foto' })
    }
    
    const faceCount = photos.filter((p: any) => p.isFace).length
    if (faceCount < 1) {
      return res.status(400).json({ error: 'Almeno una foto deve essere marcata come volto' })
    }

    // Validazione dimensioni (opzionale, max ~5MB ciascuna)
    const MAX_PER_PHOTO = 5 * 1024 * 1024; // 5MB
    for (const ph of photos) {
      try {
        const base64len = typeof ph?.url === 'string' ? ph.url.length : 0;
        if (base64len > MAX_PER_PHOTO * 1.4) { // fattore per overhead base64/dataurl
          return res.status(413).json({ error: `Una o più foto superano il limite di 5MB` })
        }
      } catch {}
    }

    // Crea tutte le foto nel DB come IN_REVIEW
    await prisma.photo.createMany({
      data: photos.map((p: any) => ({
        userId,
        url: p.url,
        name: p.name,
        size: p.size || 0,
        status: 'IN_REVIEW',
        isFace: !!p.isFace,
      }))
    })

    return res.status(200).json({ ok: true, message: 'Foto inviate in revisione' })
  } catch (err: any) {
    console.error('API /api/escort/photos/submit-simple errore:', err?.message || err)
    // Propaga messaggio più utile se disponibile
    const msg = err?.message || 'Errore interno'
    return res.status(500).json({ error: msg })
  }
}
