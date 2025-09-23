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
    const segs = (req.query.path || []) as string[]
    if (!Array.isArray(segs) || segs.length === 0) return res.status(400).end('Bad request')

    // Serve only from uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    const filePath = path.join(uploadsDir, ...segs)

    // Prevent path escape
    const rel = path.relative(uploadsDir, filePath)
    if (rel.startsWith('..')) return res.status(403).end('Forbidden')

    await fs.promises.access(filePath, fs.constants.R_OK)

    const ext = path.extname(filePath).toLowerCase()
    const type = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'application/octet-stream'
    res.setHeader('Content-Type', type)

    const stream = fs.createReadStream(filePath)
    stream.pipe(res)
  } catch (e) {
    res.status(404).end('Not found')
  }
}
