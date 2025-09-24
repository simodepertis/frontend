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
      : ext === '.pdf' ? 'application/pdf'
      : 'application/octet-stream'
    res.setHeader('Content-Type', type)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')

    const stream = fs.createReadStream(filePath)
    stream.pipe(res)
  } catch (e) {
    res.status(404).end('Not found')
  }
}
