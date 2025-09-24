import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import formidable, { File as FormidableFile } from 'formidable'
import path from 'path'
import fs from 'fs'

export const config = { api: { bodyParser: false } }

async function parseForm(req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files; }> {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  await fs.promises.mkdir(uploadDir, { recursive: true })

  const form = formidable({ multiples: false, uploadDir, keepExtensions: true })
  return await new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err)
      resolve({ fields, files })
    })
  })
}

async function requireUser(req: NextApiRequest) {
  const auth = req.headers.authorization || ''
  const raw = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!raw) return null
  const payload = verifyToken(raw)
  if (!payload) return null
  const u = await prisma.user.findUnique({ where: { id: payload.userId } })
  return u || null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireUser(req)
  if (!user) return res.status(401).json({ error: 'Non autenticato' })
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { fields, files } = await parseForm(req)
    const f = (files.file || files.upload || files.video) as FormidableFile | FormidableFile[] | undefined
    const file = Array.isArray(f) ? f[0] : f
    if (!file) return res.status(400).json({ error: 'File mancante' })

    const mime = String(file.mimetype || '').toLowerCase()
    if (!mime.startsWith('video/')) return res.status(400).json({ error: 'Formato non supportato (usa un file video)'} )
    // Limite 200MB per cautela su upload locali
    if ((file.size || 0) > 200 * 1024 * 1024) return res.status(400).json({ error: 'File troppo grande (max 200MB)' })

    const storedBasename = path.basename((file as any).filepath || (file as any).newFilename || file.originalFilename || `video_${Date.now()}`)
    const url = `/uploads/${storedBasename}`

    const title = String((fields.title as any) || file.originalFilename || 'Video')
    const duration = (fields.duration ? String(fields.duration) : null)
    const hd = String((fields.hd as any) || '').toLowerCase() === 'true'

    const created = await prisma.video.create({
      data: {
        userId: user.id,
        url,
        title,
        duration: duration || undefined,
        hd,
        status: 'DRAFT' as any,
      }
    })

    return res.status(201).json({ video: created })
  } catch (e:any) {
    console.error('Video upload error', e)
    return res.status(500).json({ error: e?.message || 'Errore interno' })
  }
}
