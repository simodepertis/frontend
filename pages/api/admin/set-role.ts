import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const adminKey = req.headers['x-admin-key'] as string | undefined
    if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { email, role } = req.body || {}
    if (!email || !role) return res.status(400).json({ error: 'email e role sono obbligatori' })

    // Normalizza ruolo come nel resto del sito
    const map: Record<string, string> = {
      utente: 'user', user: 'user',
      escort: 'escort',
      agenzia: 'agency', agency: 'agency',
      admin: 'admin',
    }
    const normalized = map[String(role).toLowerCase()] || String(role).toLowerCase()

    const user = await prisma.user.update({
      where: { email: String(email).toLowerCase() },
      data: { ruolo: normalized },
      select: { id: true, nome: true, email: true, ruolo: true }
    })

    return res.status(200).json({ updated: true, user })
  } catch (e) {
    console.error('❌ /api/admin/set-role errore', e)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
