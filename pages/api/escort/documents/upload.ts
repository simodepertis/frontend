import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import formidable, { File as FormidableFile } from 'formidable'
import path from 'path'
import fs from 'fs'

export const config = {
  api: {
    bodyParser: false,
  },
}

async function parseForm(req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files; }> {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  await fs.promises.mkdir(uploadDir, { recursive: true })

  const form = formidable({ multiples: false, uploadDir, keepExtensions: true })
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err)
      return resolve({ fields, files })
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
  if (!u) return null
  return u
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await requireUser(req)
    if (!user) return res.status(401).json({ error: 'Non autenticato' })

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const { fields, files } = await parseForm(req)
    const f = (files.file || files.upload || files.document) as FormidableFile | FormidableFile[] | undefined
    const file = Array.isArray(f) ? f[0] : f
    if (!file) return res.status(400).json({ error: 'File mancante' })

    const mime = (file.mimetype || '').toLowerCase()
    if (!mime.startsWith('image/')) return res.status(400).json({ error: 'Formato non supportato' })
    if ((file.size || 0) > 5 * 1024 * 1024) return res.status(400).json({ error: 'File troppo grande (max 5MB)' })

    // formidable has already stored the file inside public/uploads (uploadDir)
    // Build a public URL from the stored path
    const storedBasename = path.basename(file.filepath || file.newFilename || file.originalFilename || `doc_${Date.now()}`)
    const url = `/uploads/${storedBasename}`

    // Determine type from fields.type if present (can be string | string[])
    const rawField = (fields as any).type
    const rawType = (Array.isArray(rawField) ? String(rawField[0] || '') : String(rawField || '')).toUpperCase()
    const type: any = ['ID_CARD_FRONT','ID_CARD_BACK','SELFIE_WITH_ID'].includes(rawType) ? rawType : 'ID_CARD_FRONT'

    const created = await prisma.document.create({
      data: {
        userId: user.id,
        type,
        status: 'IN_REVIEW' as any,
        url,
      } as any,
    })

    return res.status(201).json({ document: created })
  } catch (e: any) {
    console.error('Document upload error', e)
    return res.status(500).json({ error: e?.message || 'Errore interno' })
  }
}
