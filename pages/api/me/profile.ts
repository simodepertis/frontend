import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function getBearerTokenFromPagesReq(req: NextApiRequest): string | null {
  const auth = req.headers.authorization
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) return auth.substring(7)
  // also check cookies
  const cookie = req.headers.cookie || ''
  const match = cookie.match(/(?:^|;\s*)auth-token=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

async function requireUser(req: NextApiRequest) {
  const raw = getBearerTokenFromPagesReq(req)
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

    if (req.method === 'GET') {
      const profile = await prisma.escortProfile.findUnique({ where: { userId: user.id } })
      return res.json({ profile })
    }

    if (req.method === 'PATCH') {
      const body = req.body || {}
      // Json-ify fields safely
      const data: any = {}
      if ('bioIt' in body) data.bioIt = String(body.bioIt || '')
      if ('bioEn' in body) data.bioEn = String(body.bioEn || '')
      if ('languages' in body) data.languages = body.languages || []
      if ('cities' in body) data.cities = body.cities || {}
      if ('services' in body) data.services = body.services || {}
      if ('rates' in body) data.rates = body.rates || {}
      if ('contacts' in body) data.contacts = body.contacts || {}

      const exists = await prisma.escortProfile.findUnique({ where: { userId: user.id } })
      const saved = exists
        ? await prisma.escortProfile.update({ where: { userId: user.id }, data })
        : await prisma.escortProfile.create({ data: { userId: user.id, ...data } as any })

      return res.json({ ok: true, profile: saved })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    console.error('Profile API error', e)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
