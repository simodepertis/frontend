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
    // Conta foto in bozza
    const photos = await prisma.photo.findMany({ 
      where: { userId, status: 'DRAFT' } 
    })
    
    if (photos.length < 3) {
      return res.status(400).json({ error: 'Devi caricare almeno 3 foto' })
    }
    
    const faceCount = photos.filter(p => p.isFace).length
    if (faceCount < 1) {
      return res.status(400).json({ error: 'Almeno una foto deve essere marcata come volto' })
    }

    // Aggiorna tutte le foto in bozza a IN_REVIEW
    await prisma.photo.updateMany({
      where: { userId, status: 'DRAFT' },
      data: { status: 'IN_REVIEW' }
    })

    return res.status(200).json({ ok: true, message: 'Foto inviate in revisione' })
  } catch (err) {
    console.error('API /api/escort/photos/submit errore:', err)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
