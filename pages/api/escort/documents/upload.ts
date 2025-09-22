import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
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
      if (err) reject(err)
      else resolve({ fields, files })
    })
  })
}

async function requireUser(req: NextApiRequest) {
  const raw = getTokenFromRequest(req as any)
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

    // Move file into public/uploads with a friendly unique name
    const ext = path.extname(file.originalFilename || file.newFilename || '') || '.jpg'
    const fname = `doc_${user.id}_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    const dest = path.join(uploadDir, fname)
    await fs.promises.copyFile(file.filepath, dest)

    const url = `/uploads/${fname}`

    // Determine type from fields.type if present
    const rawType = String((fields.type as string) || '').toUpperCase()
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
  } catch (e) {
    console.error('Document upload error', e)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
