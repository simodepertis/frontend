import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { IncomingForm } from 'formidable'

// Supporta sia JSON (data URL) che multipart/form-data nello STESSO endpoint
export const config = {
  api: {
    bodyParser: false, // disattivato per poter gestire sia JSON manuale che multipart
    sizeLimit: '50mb',
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

    if (ct.includes('application/json')) {
      console.log('➡️ Branch: JSON')
      // Leggi raw JSON manualmente (bodyParser è OFF)
      const chunks: Buffer[] = []
      await new Promise<void>((resolve, reject) => {
        req.on('data', (c) => chunks.push(Buffer.from(c)))
        req.on('end', () => resolve())
        req.on('error', reject)
      })
      const raw = Buffer.concat(chunks).toString('utf8')
      let parsed: any = {}
      try { parsed = JSON.parse(raw || '{}') } catch {}
      const { url, name, size } = parsed || {}
      if (!url || typeof url !== 'string' || !url.startsWith('data:')) {
        console.log('❌ Upload foto (JSON): URL base64 non valido')
        return res.status(400).json({ error: 'URL base64 (data:) richiesto' })
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

    if (ct.includes('multipart/form-data')) {
      console.log('➡️ Branch: multipart/form-data')
      // Parse multipart
      const form = new IncomingForm({ multiples: false, maxFileSize: 50 * 1024 * 1024 })
      const { fields, files }: any = await new Promise((resolve, reject) => {
        form.parse(req as any, (err, flds, fls) => err ? reject(err) : resolve({ fields: flds, files: fls }))
      })
      const f = files?.file || files?.image || files?.photo
      // Fallback: alcuni client inviano base64 in un campo testo, senza file
      if (!f) {
        const fieldUrl = (fields?.url || fields?.data || fields?.photo || '').toString()
        if (fieldUrl && typeof fieldUrl === 'string' && fieldUrl.startsWith('data:')) {
          console.log('ℹ️ Multipart senza file: uso fields.url base64')
          const photo = await createPhoto(fieldUrl, (fields?.name as string) || 'photo.jpg', Number(fields?.size) || undefined)
          console.log('✅ Foto creata (multipart fields.url):', { id: photo.id })
          return res.status(200).json({ photo })
        }
        console.log('❌ Upload foto (multipart): file mancante e nessun fields.url')
        return res.status(400).json({ error: 'File mancante' })
      }
      const picked: any = Array.isArray(f) ? f[0] : f
      const fs = require('fs')
      const buffer: Buffer = fs.readFileSync(picked.filepath || picked._writeStream?.path)
      const mimetype = picked.mimetype || 'image/jpeg'
      const base64 = buffer.toString('base64')
      const dataUrl = `data:${mimetype};base64,${base64}`
      const photo = await createPhoto(dataUrl, picked.originalFilename, buffer.length)
      console.log('✅ Foto creata (multipart):', { id: photo.id })
      return res.status(200).json({ photo })
    }

    console.log('❌ Upload foto: Content-Type non supportato', ct)
    return res.status(415).json({ error: 'Content-Type non supportato' })
  } catch (err: any) {
    console.error('❌ API /api/escort/photos/upload errore:', err?.message || err)
    const msg = err?.message || 'Errore interno'
    return res.status(500).json({ error: msg, details: String(err) })
  }
}
