import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const tokenHeader = req.headers.authorization?.replace('Bearer ', '')
    const auth = verifyToken(tokenHeader || '')
    if (!auth) return res.status(401).json({ error: 'Non autenticato' })

    const prof = await prisma.escortProfile.findUnique({ where: { userId: auth.userId } })
    const contacts = (prof?.contacts as any) || {}
    const hasAccess = !!(contacts?.addons?.apartmentAds)

    return res.status(200).json({ ok: true, hasAccess })
  } catch (e) {
    return res.status(500).json({ error: 'Errore interno' })
  }
}
