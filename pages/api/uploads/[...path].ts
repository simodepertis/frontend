import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    let segs = (req.query.path || []) as string[]
    if (!Array.isArray(segs) || segs.length === 0) return res.status(400).end('Bad request')
    // Normalize segments: strip accidental leading 'uploads' and decode
    segs = segs.map(s => decodeURIComponent(s)).filter(Boolean)
    if (segs[0] === 'uploads') segs = segs.slice(1)

    // Serve only from uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    let filePath = path.join(uploadsDir, ...segs)

    // Prevent path escape
    const rel = path.relative(uploadsDir, filePath)
    if (rel.startsWith('..')) return res.status(403).end('Forbidden')

    // Try primary path; if missing, try with only basename (legacy saved URLs)
    try {
      await fs.promises.access(filePath, fs.constants.R_OK)
    } catch {
      const base = path.basename(filePath)
      const alt = path.join(uploadsDir, base)
      try {
        await fs.promises.access(alt, fs.constants.R_OK)
        filePath = alt
      } catch {
        return res.status(404).end('Not found')
      }
    }

    const ext = path.extname(filePath).toLowerCase()
    const type = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
      : ext === '.png' ? 'image/png'
      : ext === '.webp' ? 'image/webp'
      : ext === '.gif' ? 'image/gif'
      : ext === '.svg' ? 'image/svg+xml'
      : ext === '.mp4' ? 'video/mp4'
      : ext === '.webm' ? 'video/webm'
      : ext === '.mov' ? 'video/quicktime'
      : ext === '.mkv' ? 'video/x-matroska'
      : ext === '.mp3' ? 'audio/mpeg'
      : ext === '.wav' ? 'audio/wav'
      : ext === '.pdf' ? 'application/pdf'
      : 'application/octet-stream'

    const stat = await fs.promises.stat(filePath)
    const fileSize = stat.size
    res.setHeader('Accept-Ranges', 'bytes')
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')

    const range = req.headers.range
    if (range && (type.startsWith('video/') || type.startsWith('audio/'))) {
      const match = /bytes=(\d+)-(\d+)?/.exec(range)
      let start = 0
      let end = fileSize - 1
      if (match) {
        start = parseInt(match[1], 10)
        if (match[2]) end = parseInt(match[2], 10)
      }
      if (start >= fileSize || end >= fileSize) {
        res.status(416).setHeader('Content-Range', `bytes */${fileSize}`).end()
        return
      }
      res.status(206)
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`)
      res.setHeader('Content-Length', String(end - start + 1))
      res.setHeader('Content-Type', type)
      const stream = fs.createReadStream(filePath, { start, end })
      stream.pipe(res)
      return
    }

    // Full content
    res.setHeader('Content-Type', type)
    res.setHeader('Content-Length', String(fileSize))
    const stream = fs.createReadStream(filePath)
    stream.pipe(res)
  } catch (e) {
    res.status(404).end('Not found')
  }
}
