import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
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
  if (!userId) {
    console.log('❌ Upload foto: utente non autenticato')
    return res.status(401).json({ error: 'Non autenticato' })
  }

  try {
    const { url, name, size } = req.body || {}
    
    console.log('🗒️ Body ricevuto:', {
      hasUrl: !!url,
      hasName: !!name,
      urlType: typeof url,
      nameValue: name
    })
    
    if (!url || !name) {
      console.log('❌ Upload foto: url o name mancanti')
      return res.status(400).json({ error: 'URL e nome richiesti' })
    }
    
    const photoUrl = url
    const photoName = name
    const photoSize = size || 0
    
    console.log('📸 Creazione foto:', { userId, name: photoName, size: photoSize, urlPreview: photoUrl?.slice(0, 30) })
    
    const photo = await prisma.photo.create({
      data: {
        userId,
        url: photoUrl,
        name: photoName,
        size: photoSize,
        status: 'DRAFT',
        isFace: false,
      },
    })
    
    console.log('✅ Foto creata con successo:', { id: photo.id, status: photo.status })

    return res.status(200).json({ photo })
  } catch (err) {
    console.error('❌ API /api/escort/photos/upload errore:', err)
    return res.status(500).json({ error: 'Errore interno', details: String(err) })
  }
}
