import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'

export const config = { api: { bodyParser: false } }

function getProjectRootDir(): string {
  const base = process.env.PM2_CWD || process.cwd()
  const normalized = base.replace(/\\/g, '/')
  if (normalized.endsWith('/.next/standalone') || normalized.includes('/.next/standalone/')) {
    return path.resolve(base, '..', '..')
  }
  return base
}

async function parseForm(req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files; }> {
  const projectRoot = getProjectRootDir()
  const uploadDir = path.join(projectRoot, 'public', 'uploads', '_tmp')
  await fs.promises.mkdir(uploadDir, { recursive: true })
  const form = formidable({ multiples: false, uploadDir, keepExtensions: true, maxFileSize: 8 * 1024 * 1024 })
  return await new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err)
      resolve({ fields, files })
    })
  })
}

function getUserIdFromAuth(req: NextApiRequest): number | null {
  const auth = req.headers.authorization || ''
  const raw = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!raw) return null
  const payload = verifyToken(raw)
  return payload?.userId || null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const agencyUserId = getUserIdFromAuth(req)
    if (!agencyUserId) return res.status(401).json({ error: 'Non autenticato' })

    const { fields, files } = await parseForm(req)
    const escortUserId = Number((fields.escortUserId as any) || 0)
    if (!escortUserId) return res.status(400).json({ error: 'escortUserId obbligatorio' })

    const prof = await prisma.escortProfile.findUnique({ where: { userId: escortUserId } })
    if (!prof || prof.agencyId !== agencyUserId) return res.status(403).json({ error: 'Escort non collegata alla tua agenzia' })

    const f = (files.file || files.upload || files.image) as formidable.File | formidable.File[] | undefined
    const file = Array.isArray(f) ? f[0] : f
    if (!file) return res.status(400).json({ error: 'File mancante' })

    const projectRoot = getProjectRootDir()
    const destDir = path.join(projectRoot, 'public', 'uploads', 'escort-photos', String(escortUserId))
    await fs.promises.mkdir(destDir, { recursive: true })

    const srcPath = String((file as any).filepath || '')
    const storedBasename = path.basename(
      (file as any).newFilename ||
      file.originalFilename ||
      `photo_${Date.now()}`
    )
    const destPath = path.join(destDir, storedBasename)
    if (srcPath) {
      await fs.promises.copyFile(srcPath, destPath)
      try { await fs.promises.unlink(srcPath) } catch {}
    }

    const publicUrl = `/api/uploads/escort-photos/${escortUserId}/${storedBasename}`

    const created = await prisma.photo.create({
      data: {
        userId: escortUserId,
        url: publicUrl,
        name: file.originalFilename || storedBasename,
        size: Number(file.size || 0),
        status: 'DRAFT' as any,
      }
    })

    return res.status(201).json({ photo: created })
  } catch (e: any) {
    console.error('Agency photo upload error', e)
    return res.status(500).json({ error: e?.message || 'Errore upload' })
  }
}
