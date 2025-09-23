import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'

export const config = {
  api: {
    bodyParser: false,
  },
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
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await fs.promises.mkdir(uploadDir, { recursive: true })

    const form = formidable({ multiples: false, maxFileSize: 8 * 1024 * 1024 })
    const { fields, files } = await new Promise<any>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err)
        else resolve({ fields, files })
      })
    })

    const file = (files.file && (Array.isArray(files.file) ? files.file[0] : files.file)) as formidable.File | undefined
    if (!file || !file.filepath) {
      return res.status(400).json({ error: 'File mancante' })
    }

    const fileNameSafe = file.originalFilename?.replace(/[^a-zA-Z0-9_.-]+/g, '_') || `photo_${Date.now()}.jpg`
    const finalPath = path.join(uploadDir, `${Date.now()}_${fileNameSafe}`)
    await fs.promises.copyFile(file.filepath, finalPath)

    // Serve via API route to avoid static hosting issues on Render
    const publicUrl = `/api/uploads/${path.basename(finalPath)}`

    const created = await prisma.photo.create({
      data: {
        userId: user.id,
        url: publicUrl,
        name: file.originalFilename || path.basename(finalPath),
        size: Number(file.size || 0),
        status: 'IN_REVIEW' as any,
      },
    })

    return res.json({ photo: created })
  } catch (err) {
    console.error('❌ Upload foto errore:', err)
    return res.status(500).json({ error: 'Errore upload' })
  }
}
