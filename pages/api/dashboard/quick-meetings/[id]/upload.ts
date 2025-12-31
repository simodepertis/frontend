import type { NextApiRequest, NextApiResponse } from 'next'
import { IncomingForm } from 'formidable'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { mkdir, copyFile } from 'node:fs/promises'
import path from 'node:path'

export const config = {
  api: {
    bodyParser: false,
  },
}

function getProjectRootDir(): string {
  const base = process.env.PM2_CWD || process.cwd()
  const normalized = base.replace(/\\/g, '/')
  if (normalized.endsWith('/.next/standalone') || normalized.includes('/.next/standalone/')) {
    return path.resolve(base, '..', '..')
  }
  return base
}

function getUserFromToken(req: NextApiRequest): { userId: number } | null {
  try {
    let token: string | undefined

    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }

    if (!token) {
      token = req.cookies['auth-token']
    }

    if (!token) return null

    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string }
    return { userId: decoded.userId }
  } catch {
    return null
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo non consentito' })

  const auth = getUserFromToken(req)
  if (!auth) return res.status(401).json({ error: 'Non autorizzato' })

  const meetingId = Number(req.query.id)
  if (!meetingId || Number.isNaN(meetingId)) return res.status(400).json({ error: 'ID annuncio non valido' })

  // Verifica ownership
  const meeting = await prisma.quickMeeting.findFirst({
    where: { id: meetingId, userId: auth.userId },
    select: { id: true },
  })
  if (!meeting) return res.status(404).json({ error: 'Annuncio non trovato' })

  try {
    const baseDir = getProjectRootDir()
    const uploadDir = path.join(baseDir, 'public', 'uploads', 'quick-meetings', String(meetingId))
    await mkdir(uploadDir, { recursive: true })

    const files = await new Promise<Array<{ filepath: string; originalFilename?: string; mimetype?: string; size?: number }>>(
      (resolve, reject) => {
        const form = new IncomingForm({
          multiples: true,
          maxFileSize: 20 * 1024 * 1024,
        })

        form.parse(req as any, (err, _fields, parsedFiles) => {
          if (err) return reject(err)

          const anyFiles: any = parsedFiles
          const f = anyFiles?.files || anyFiles?.file || anyFiles?.image || anyFiles?.photo
          if (!f) return reject(new Error('File mancante'))

          const arr = Array.isArray(f) ? f : [f]
          resolve(
            arr
              .filter(Boolean)
              .map((x: any) => ({
                filepath: x.filepath,
                originalFilename: x.originalFilename,
                mimetype: x.mimetype,
                size: x.size,
              }))
          )
        })
      }
    )

    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp'])

    const uploaded: Array<{ url: string; name: string; size: number }> = []

    for (const f of files) {
      if (!f?.filepath) continue
      const mime = String(f.mimetype || '')
      if (mime && !allowed.has(mime)) {
        return res.status(400).json({ error: 'Formato non consentito (solo JPG/PNG/WEBP)' })
      }

      const ext = path.extname(f.originalFilename || '') || (mime === 'image/png' ? '.png' : mime === 'image/webp' ? '.webp' : '.jpg')
      const safeBase = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const filename = `${safeBase}${ext}`
      const dest = path.join(uploadDir, filename)
      await copyFile(f.filepath, dest)

      const publicUrl = `/api/uploads/quick-meetings/${meetingId}/${filename}`
      uploaded.push({ url: publicUrl, name: f.originalFilename || filename, size: Number(f.size) || 0 })
    }

    return res.status(200).json({ ok: true, uploaded })
  } catch (err: any) {
    console.error('❌ Upload quick-meetings error:', err?.message || err)
    return res.status(500).json({ error: err?.message || 'Errore upload' })
  }
}
