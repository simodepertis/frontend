import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export const config = { api: { bodyParser: false } }

function getUserId(req: NextApiRequest): number | null {
  const auth = req.headers.authorization
  const token = auth?.startsWith('Bearer ') ? auth.substring(7) : (req.cookies as any)['auth-token']
  if (!token) return null
  const payload = verifyToken(token)
  return payload?.userId ?? null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🎬 Upload video handler START', { method: req.method })
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo non consentito' })

  const userId = getUserId(req)
  console.log('👤 getUserId result:', userId)
  if (!userId) {
    console.log('❌ Upload video: utente non autenticato')
    return res.status(401).json({ error: 'Non autenticato' })
  }

  try {
    const ct = String(req.headers['content-type'] || '')
    console.log('📥 Upload video CT:', ct)

    if (ct.includes('application/json') || ct.includes('text/')) {
      console.log('➡️ Branch: JSON base64')
      // Leggi body manualmente
      const chunks: Buffer[] = []
      const MAX_SIZE = 15 * 1024 * 1024 // 15MB max per video (Vercel limit)
      let totalSize = 0
      
      try {
        await new Promise<void>((resolve, reject) => {
          req.on('data', (chunk: Buffer) => {
            totalSize += chunk.length
            if (totalSize > MAX_SIZE) {
              reject(new Error('Payload troppo grande'))
              return
            }
            chunks.push(chunk)
          })
          req.on('end', () => resolve())
          req.on('error', reject)
        })
      } catch (e: any) {
        console.log('❌ Errore lettura body:', e.message)
        return res.status(413).json({ error: 'Video troppo grande (max 15MB). Comprimi o usa URL esterno.' })
      }
      
      const raw = Buffer.concat(chunks).toString('utf8')
      console.log('📦 Body letto, lunghezza:', raw.length)
      
      let parsed: any = {}
      try {
        parsed = JSON.parse(raw || '{}')
      } catch (e) {
        console.log('❌ JSON parse error')
        return res.status(400).json({ error: 'JSON non valido' })
      }
      
      const { url, title, duration, hd } = parsed || {}
      console.log('🔍 Extracted:', { hasUrl: !!url, urlType: typeof url, urlStart: url?.slice(0, 20), title })
      if (!url || typeof url !== 'string' || !url.startsWith('data:video/')) {
        console.log('❌ Upload video (JSON): URL base64 video non valido', { url: url?.slice(0, 50) })
        return res.status(400).json({ error: 'URL base64 video (data:video/) richiesto', debug: { hasUrl: !!url, type: typeof url, starts: url?.slice(0, 30) } })
      }
      
      // Limite esplicito per Vercel/serverless
      const MAX_BASE64_BYTES = 15 * 1024 * 1024
      if (url.length > MAX_BASE64_BYTES) {
        const sizeMB = (url.length / 1024 / 1024).toFixed(2)
        console.log(`❌ Upload video (JSON): dimensione ${sizeMB}MB supera limite ${(MAX_BASE64_BYTES/1024/1024).toFixed(1)}MB`)
        return res.status(413).json({ error: `Video troppo grande (${sizeMB}MB). Massimo 15MB o usa URL YouTube/Vimeo.` })
      }
      
      const videoTitle = (typeof title === 'string' && title.trim()) ? title.trim() : 'Video'
      const videoDuration = (typeof duration === 'string' && duration.trim()) ? duration.trim() : null
      const videoHd = Boolean(hd)
      
      console.log('🎬 Creazione video:', { userId, title: videoTitle, duration: videoDuration, hd: videoHd, urlPreview: url.slice(0,30) })
      const video = await prisma.video.create({
        data: { 
          userId, 
          url, 
          title: videoTitle, 
          duration: videoDuration, 
          hd: videoHd, 
          status: 'DRAFT' 
        }
      })
      console.log('✅ Video creato (JSON):', { id: video.id })
      return res.status(201).json({ video })
    }

    console.log('❌ Upload video: Content-Type non supportato', ct)
    return res.status(415).json({ error: 'Solo Content-Type application/json supportato (invia base64)' })
  } catch (err: any) {
    console.error('❌ API /api/escort/videos/upload-file errore:', err?.message || err)
    const msg = err?.message || 'Errore interno'
    return res.status(500).json({ error: msg, details: String(err) })
  }
}
