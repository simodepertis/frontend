import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export const config = { api: { bodyParser: false } }

async function parseForm(req: NextApiRequest): Promise<Record<string, any>> {
  return await new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf-8')
        // Fallback: handle simple x-www-form-urlencoded or fetch FormData serialized
        const params = new URLSearchParams(text)
        const obj: Record<string, any> = {}
        params.forEach((v, k) => { obj[k] = v })
        resolve(obj)
      } catch (e) { reject(e) }
    })
    req.on('error', reject)
  })
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
    const data = await parseForm(req)
    const url = String(data.url || '')
    if (!url) return res.status(400).json({ error: 'URL mancante' })
    const title = String(data.title || 'Video')
    const thumb = data.thumb ? String(data.thumb) : null
    const duration = data.duration ? String(data.duration) : null
    const hd = String(data.hd || '').toLowerCase() === 'true'

    const created = await prisma.video.create({
      data: {
        userId: user.id,
        url,
        title,
        thumb: thumb || undefined,
        duration: duration || undefined,
        hd,
        status: 'DRAFT' as any,
      }
    })
    return res.json({ video: created })
  } catch (e) {
    console.error('❌ Upload video errore:', e)
    return res.status(500).json({ error: 'Errore upload' })
  }
}
