import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Verifica admin
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ error: 'Token mancante' })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return res.status(401).json({ error: 'Token non valido' })
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { ruolo: true }
    })

    if (user?.ruolo !== 'admin') {
      return res.status(403).json({ error: 'Accesso negato' })
    }

    if (req.method === 'GET') {
      // Carica profili con consenso
      const profiles = await prisma.escortProfile.findMany({
        where: {
          consentAcceptedAt: { not: null }
        },
        include: {
          user: {
            select: {
              id: true,
              nome: true,
              email: true,
              createdAt: true,
              slug: true
            }
          }
        },
        orderBy: { consentAcceptedAt: 'asc' }
      })

      console.log('🔍 DEBUG Admin Profiles - Profiles with consent:', profiles.length)

      const formattedProfiles = profiles.map(profile => ({
        id: profile.id,
        userId: profile.userId,
        nome: profile.user.nome,
        email: profile.user.email,
        tier: profile.tier || 'STANDARD',
        verified: true,
        createdAt: profile.user.createdAt.toISOString().split('T')[0],
        cities: Array.isArray(profile.cities) ? profile.cities : [],
        consentDate: profile.consentAcceptedAt?.toISOString().split('T')[0]
      }))

      console.log('🔍 DEBUG Admin Profiles - Formatted profiles:', formattedProfiles.length)
      return res.json({ profiles: formattedProfiles })
    }

    if (req.method === 'PATCH') {
      try {
        const { profileId, action } = req.body as { profileId?: number; action?: string }
        if (!profileId || !action) {
          return res.status(400).json({ error: 'Parametri mancanti' })
        }

        const normalized = String(action).toLowerCase()
        if (!['approve', 'reject'].includes(normalized)) {
          return res.status(400).json({ error: 'Azione non valida' })
        }

        // Per riflettere l'azione sul frontend (lista dei profili in coda),
        // entrambe le azioni rimuovono l'elemento dalla coda azzerando il consenso.
        await prisma.escortProfile.update({
          where: { id: Number(profileId) },
          data: { consentAcceptedAt: null },
        })
        return res.json({ success: true, message: normalized === 'approve' ? 'Profilo approvato' : 'Profilo rifiutato' })
      } catch (err) {
        console.error('❌ Errore PATCH admin/profiles:', err)
        return res.status(500).json({ error: 'Errore interno' })
      }
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: unknown) {
    console.error('❌ Errore caricamento profili:', error)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
