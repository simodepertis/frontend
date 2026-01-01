import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function getBearerToken(req: NextApiRequest): string | null {
  const auth = (req.headers.authorization || (req.headers as any).Authorization) as string | undefined
  if (auth && typeof auth === 'string' && auth.startsWith('Bearer ')) return auth.slice(7)
  const cookie = req.cookies['auth-token']
  return cookie || null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const token = getBearerToken(req)
    if (!token) return res.status(401).json({ error: 'Non autenticato' })
    const payload = verifyToken(token)
    if (!payload) return res.status(401).json({ error: 'Token non valido' })

    const escorts = await prisma.escortProfile.findMany({
      where: { agencyId: payload.userId },
      include: {
        user: {
          select: {
            id: true,
            nome: true,
            email: true,
            documents: {
              where: { status: 'APPROVED' },
              select: { id: true, type: true, status: true, createdAt: true },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    const approved = escorts
      .filter((e) => (e.user as any)?.documents?.length > 0)
      .map((e) => ({
        escortUserId: e.userId,
        nome: (e.user as any)?.nome || '',
        email: (e.user as any)?.email || '',
        approvedDocuments: (e.user as any)?.documents || [],
      }))

    return res.status(200).json({ approved })
  } catch (e) {
    console.error('❌ /api/agency/escorts/certificazione-eta errore', e)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
