import type { NextApiRequest, NextApiResponse } from 'next'
import { IncomingForm } from 'formidable'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export const config = {
  api: {
    bodyParser: false, // necessario per multipart/form-data
    sizeLimit: '20mb',
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
    const file = await new Promise<{ buffer: Buffer, filename: string, mimetype: string }>((resolve, reject) => {
      const form = new IncomingForm({ multiples: false, maxFileSize: 20 * 1024 * 1024 })
      form.parse(req as any, (err, fields, files) => {
        if (err) return reject(err)
        const anyFiles: any = files
        const f = anyFiles?.file || anyFiles?.image || anyFiles?.photo
        if (!f) return reject(new Error('File mancante'))
        // "formidable" può restituire array
        const picked: any = Array.isArray(f) ? f[0] : f
        if (!picked?.filepath && !picked?._writeStream) return reject(new Error('File non valido'))
        const fs = require('fs')
        const buffer = fs.readFileSync(picked.filepath || picked._writeStream?.path)
        resolve({ buffer, filename: picked.originalFilename || 'photo.jpg', mimetype: picked.mimetype || 'image/jpeg' })
      })
    })

    const base64 = file.buffer.toString('base64')
    const dataUrl = `data:${file.mimetype};base64,${base64}`

    const photo = await prisma.photo.create({
      data: {
        userId,
        url: dataUrl,
        name: file.filename,
        size: file.buffer.length,
        status: 'DRAFT',
        isFace: false,
      }
    })

    return res.status(200).json({ photo })
  } catch (err: any) {
    console.error('❌ API /api/escort/photos/upload-file errore:', err)
    const msg = err?.message || 'Errore interno'
    return res.status(400).json({ error: msg })
  }
}
