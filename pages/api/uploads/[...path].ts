import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

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

function getLegacyStandaloneUploadsDir(projectRoot: string): string {
  return path.join(projectRoot, '.next', 'standalone', 'public', 'uploads')
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.promises.access(p, fs.constants.R_OK)
    return true
  } catch {
    return false
  }
}

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.png') return 'image/png'
  if (ext === '.webp') return 'image/webp'
  if (ext === '.gif') return 'image/gif'
  if (ext === '.svg') return 'image/svg+xml'
  if (ext === '.mp4') return 'video/mp4'
  if (ext === '.webm') return 'video/webm'
  if (ext === '.mov') return 'video/quicktime'
  if (ext === '.mkv') return 'video/x-matroska'
  if (ext === '.mp3') return 'audio/mpeg'
  if (ext === '.wav') return 'audio/wav'
  if (ext === '.pdf') return 'application/pdf'
  return 'application/octet-stream'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    let segs = (req.query.path || []) as string[]
    if (!Array.isArray(segs) || segs.length === 0) {
      res.status(400).end('Bad request')
      return
    }
    // Normalize segments: strip accidental leading 'uploads' and decode
    segs = segs.map(s => decodeURIComponent(s)).filter(Boolean)
    if (segs[0] === 'uploads') segs = segs.slice(1)

    const safePath = segs.map(s => s.replace(/\//g, '')).join('/')
    const projectRoot = getProjectRootDir()
    const publicUploadsDir = path.join(projectRoot, 'public', 'uploads')
    const publicFilePath = path.join(publicUploadsDir, ...segs)
    const rel = path.relative(publicUploadsDir, publicFilePath)
    if (rel.startsWith('..')) {
      res.status(403).end('Forbidden')
      return
    }

    if (await fileExists(publicFilePath)) {
      const location = `/uploads/${safePath}`
      res.setHeader('Cache-Control', 'no-cache')
      res.redirect(307, location)
      return
    }

    const legacyUploadsDir = getLegacyStandaloneUploadsDir(projectRoot)
    const legacyFilePath = path.join(legacyUploadsDir, ...segs)
    const legacyRel = path.relative(legacyUploadsDir, legacyFilePath)
    if (!legacyRel.startsWith('..') && (await fileExists(legacyFilePath))) {
      const stat = await fs.promises.stat(legacyFilePath)
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      res.setHeader('Content-Type', getContentType(legacyFilePath))
      res.setHeader('Content-Length', String(stat.size))
      fs.createReadStream(legacyFilePath).pipe(res)
      return
    }

    res.status(404).end('Not found')
    return
  } catch (e) {
    res.status(404).end('Not found')
  }
}
