import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4.5mb', // Limite Vercel serverless
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
  console.log('🚀 Upload foto handler START', { method: req.method })
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo non consentito' })

  const userId = getUserId(req)
  console.log('👤 getUserId result:', userId)
  if (!userId) {
    console.log('❌ Upload foto: utente non autenticato')
    return res.status(401).json({ error: 'Non autenticato' })
  }

  try {
    const ct = String(req.headers['content-type'] || '')
    console.log('📥 Upload CT:', ct)

    // Helper: crea record su DB
    async function createPhoto(url: string, name?: string, size?: number) {
      const photoUrl = url
      const photoName = (typeof name === 'string' && name.trim()) ? name.trim() : 'photo.jpg'
      const photoSize = (typeof size === 'number' && size > 0) ? size : url.length
      console.log('📸 Creazione foto:', { userId, name: photoName, size: photoSize, urlPreview: photoUrl.slice(0,30) })
      const photo = await prisma.photo.create({
        data: { userId, url: photoUrl, name: photoName, size: photoSize, status: 'DRAFT', isFace: false }
      })
      return photo
    }

    if (ct.includes('application/json') || ct.includes('text/')) {
      console.log('➡️ Branch: JSON')
      console.log('📦 req.body type:', typeof req.body, 'keys:', Object.keys(req.body || {}))
      const { url, name, size } = req.body || {}
      console.log('🔍 Extracted:', { hasUrl: !!url, urlType: typeof url, urlStart: url?.slice(0, 20), name, size })
      if (!url || typeof url !== 'string' || !url.startsWith('data:')) {
        console.log('❌ Upload foto (JSON): URL base64 non valido', { url: url?.slice(0, 50) })
        return res.status(400).json({ error: 'URL base64 (data:) richiesto', debug: { hasUrl: !!url, type: typeof url, starts: url?.slice(0, 20) } })
      }
      // Limite esplicito per Vercel/serverless: ~3.5MB sul base64
      const MAX_BASE64_BYTES = 3.5 * 1024 * 1024
      if (url.length > MAX_BASE64_BYTES) {
        const sizeMB = (url.length / 1024 / 1024).toFixed(2)
        console.log(`❌ Upload foto (JSON): dimensione ${sizeMB}MB supera limite ${(MAX_BASE64_BYTES/1024/1024).toFixed(1)}MB`)
        return res.status(413).json({ error: `Immagine troppo grande (${sizeMB}MB). Comprimi o riduci risoluzione.` })
      }
      const photo = await createPhoto(url, name, size)
      console.log('✅ Foto creata (JSON):', { id: photo.id })
      return res.status(200).json({ photo })
    }

    // Multipart NON supportato su Vercel (read-only filesystem)
    // Usiamo solo JSON base64

    console.log('❌ Upload foto: Content-Type non supportato', ct)
    return res.status(415).json({ error: 'Solo Content-Type application/json supportato (invia base64)' })
  } catch (err: any) {
    console.error('❌ API /api/escort/photos/upload errore:', err?.message || err)
    const msg = err?.message || 'Errore interno'
    return res.status(500).json({ error: msg, details: String(err) })
  }
}
