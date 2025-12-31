import type { NextApiRequest, NextApiResponse } from 'next'
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

    // Hotfix: serve uploads via static Next public/ folder.
    // This avoids filesystem path issues in /api/uploads when running under PM2/Next builds.
    const safePath = segs.map(s => s.replace(/\//g, '')).join('/')
    const location = `/uploads/${safePath}`
    res.setHeader('Cache-Control', 'no-cache')
    res.redirect(307, location)
  } catch (e) {
    res.status(404).end('Not found')
  }
}
