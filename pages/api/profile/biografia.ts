import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Non autenticato' })
  const payload = verifyToken(token)
  if (!payload) return res.status(401).json({ error: 'Token non valido' })

  if (req.method === 'GET') {
    const prof = await prisma.escortProfile.findUnique({ where: { userId: payload.userId } })
    const contacts = (prof?.contacts as any) || {}
    return res.json({
      bioIt: prof?.bioIt || '',
      info: contacts.bioInfo || null,
    })
  }

  if (req.method === 'PATCH') {
    const { bioIt, info } = req.body || {}
    const prof = await prisma.escortProfile.upsert({
      where: { userId: payload.userId },
      update: {
        bioIt: bioIt ?? undefined,
        contacts: (await (async ()=>{
          const current = await prisma.escortProfile.findUnique({ where: { userId: payload.userId } })
          const base = (current?.contacts as any) || {}
          return info ? { ...base, bioInfo: info } : base
        })()) as any,
      },
      create: {
        userId: payload.userId,
        bioIt: bioIt ?? '',
        contacts: info ? { bioInfo: info } as any : undefined,
      },
    })
    return res.json({ ok: true, bioIt: prof.bioIt, info: (prof.contacts as any)?.bioInfo || null })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
