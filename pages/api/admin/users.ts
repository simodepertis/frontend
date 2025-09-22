import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
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

      // Carica utenti
      const users = await prisma.user.findMany({
        select: {
          id: true,
          nome: true,
          email: true,
          ruolo: true,
          createdAt: true,
          escortProfile: {
            select: {
              tier: true,
              consentAcceptedAt: true,
              cities: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      })

      console.log('✅ Admin users caricati:', users.length)
      return res.json({ users })
    } catch (error: unknown) {
      console.error('❌ Errore API admin users:', error)
      return res.status(500).json({ error: 'Errore interno del server' })
    }
  }

  if (req.method === 'DELETE') {
    try {
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

      const { userId } = req.query
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'User ID richiesto' })
      }

      // Elimina utente e tutti i suoi dati
      await prisma.user.delete({
        where: { id: parseInt(userId) }
      })

      console.log('✅ Utente eliminato:', userId)
      return res.json({ success: true })
    } catch (error: unknown) {
      console.error('❌ Errore eliminazione utente:', error)
      return res.status(500).json({ error: 'Errore interno del server' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
