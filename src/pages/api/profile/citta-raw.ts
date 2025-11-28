import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function getUserId(req: NextApiRequest): number | null {
  const auth = req.headers.authorization
  const token = auth?.startsWith('Bearer ') ? auth.substring(7) : (req.cookies as any)['auth-token']
  if (!token) return null
  const payload = verifyToken(token)
  return payload?.userId ?? null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Non autenticato' })

  if (req.method !== 'GET') return res.status(405).json({ error: 'Metodo non consentito' })

  try {
    const profile = await prisma.escortProfile.findUnique({ where: { userId } })
    if (!profile) return res.status(404).json({ error: 'Profilo non trovato' })

    return res.status(200).json({ cities: profile.cities })
  } catch (err) {
    console.error('API /api/profile/citta-raw errore:', err)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
