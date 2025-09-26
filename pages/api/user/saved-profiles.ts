import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function getBearerToken(req: NextApiRequest): string | null {
  const auth = (req.headers.authorization || (req.headers as any).Authorization) as string | undefined
  if (auth && typeof auth === 'string' && auth.startsWith('Bearer ')) return auth.slice(7)
  const cookie = req.cookies['auth-token']
  return cookie || null
}

// Modello per profili salvati (usando la tabella Favorite con un flag diverso)
// Per ora riutilizziamo la tabella Favorite, in futuro si può creare una tabella separata

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = getBearerToken(req)
  if (!token) return res.status(401).json({ error: 'Non autenticato' })
  const payload = verifyToken(token)
  if (!payload) return res.status(401).json({ error: 'Token non valido' })

  if (req.method === 'GET') {
    // Per ora restituiamo i preferiti come profili salvati
    // In futuro si può distinguere tra preferiti e profili salvati
    const favorites = await prisma.favorite.findMany({
      where: { userId: payload.userId },
      include: {
        targetUser: {
          include: {
            escortProfile: {
              select: {
                cities: true,
                tier: true,
                rates: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const savedProfiles = await Promise.all(
      favorites.map(async (fav) => {
        const photo = await prisma.photo.findFirst({
          where: { userId: fav.targetUserId, status: 'APPROVED' as any },
          orderBy: { updatedAt: 'desc' }
        })

        const cities = fav.targetUser.escortProfile?.cities as any
        const city = Array.isArray(cities) ? cities[0] : (cities?.baseCity || '—')
        
        return {
          id: fav.id,
          targetUserId: fav.targetUserId,
          nome: fav.targetUser.nome,
          slug: fav.targetUser.slug || `${fav.targetUser.nome.toLowerCase().replace(/\s+/g, '-')}-${fav.targetUserId}`,
          city: String(city),
          photo: photo?.url ? `/api${photo.url}` : '/placeholder.svg',
          tier: fav.targetUser.escortProfile?.tier || 'STANDARD',
          savedAt: fav.createdAt
        }
      })
    )

    return res.json({ savedProfiles })
  }

  if (req.method === 'POST') {
    // Salva profilo (per ora uguale ad aggiungere ai preferiti)
    const { targetUserId } = req.body
    if (!targetUserId || !Number.isInteger(targetUserId)) {
      return res.status(400).json({ error: 'targetUserId richiesto' })
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } })
    if (!targetUser) {
      return res.status(404).json({ error: 'Utente non trovato' })
    }

    if (targetUserId === payload.userId) {
      return res.status(400).json({ error: 'Non puoi salvare il tuo profilo' })
    }

    try {
      const saved = await prisma.favorite.create({
        data: {
          userId: payload.userId,
          targetUserId: targetUserId
        }
      })
      return res.json({ success: true, saved })
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Profilo già salvato' })
      }
      throw error
    }
  }

  if (req.method === 'DELETE') {
    const { targetUserId } = req.body
    if (!targetUserId || !Number.isInteger(targetUserId)) {
      return res.status(400).json({ error: 'targetUserId richiesto' })
    }

    const deleted = await prisma.favorite.deleteMany({
      where: {
        userId: payload.userId,
        targetUserId: targetUserId
      }
    })

    if (deleted.count === 0) {
      return res.status(404).json({ error: 'Profilo salvato non trovato' })
    }

    return res.json({ success: true })
  }

  res.setHeader('Allow', 'GET,POST,DELETE')
  return res.status(405).json({ error: 'Method not allowed' })
}
