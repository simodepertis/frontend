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
  } catch (err) {
    console.error('API /api/escort/photos/submit-simple errore:', err)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
