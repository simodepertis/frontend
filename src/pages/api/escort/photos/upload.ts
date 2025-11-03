import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
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
    const body = req.body || {}
    // Supporta diversi nomi campo usati dal frontend: url | file | image | data
    const rawUrl: any = (body as any)?.url || (body as any)?.file || (body as any)?.image || (body as any)?.data
    const rawName: any = (body as any)?.name || (body as any)?.filename || (body as any)?.fileName || 'photo.jpg'
    const rawSize: any = (body as any)?.size || (body as any)?.fileSize || 0

    console.log('🗒️ Body ricevuto:', {
      hasBody: !!body,
      bodyKeys: Object.keys(body),
      hasUrl: !!rawUrl,
      hasName: !!rawName,
      urlLength: typeof rawUrl === 'string' ? rawUrl.length : 0,
      nameValue: rawName
    })
    
    if (!rawUrl || !rawName) {
      console.log('❌ Upload foto: campo file mancante', { hasUrl: !!rawUrl, hasName: !!rawName })
      return res.status(400).json({ error: 'File mancante' })
    }

    // Normalizza base64: se è oggetto, prova a leggere .base64; se è URL esterno, accetta così com'è
    let photoUrl = typeof rawUrl === 'string' ? rawUrl : (rawUrl as any)?.base64 || ''
    if (!photoUrl) {
      return res.status(400).json({ error: 'File mancante' })
    }
    // Se manca il prefix data:, aggiungi un default (assumiamo JPEG)
    if (photoUrl.startsWith('/')) {
      // Caso path relativo già caricato altrove: accetta
    } else if (!photoUrl.startsWith('data:') && !photoUrl.startsWith('http')) {
      photoUrl = `data:image/jpeg;base64,${photoUrl}`
    }

    const photoName = String(rawName)
    const photoSize = Number(rawSize) || 0
    
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
