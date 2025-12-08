import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verifica admin per tutti i metodi
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Token mancante' })
  const decoded = verifyToken(token)
  if (!decoded) return res.status(401).json({ error: 'Token non valido' })
  const me = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { ruolo: true } })
  if (me?.ruolo !== 'admin') return res.status(403).json({ error: 'Accesso negato' })

  if (req.method === 'GET') {
    try {
      const role = String(req.query.role || '').trim()
      const whereRole = role && role !== 'all' ? { ruolo: role } : {}

      const users = await prisma.user.findMany({
        where: whereRole as any,
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: {
          escortProfile: { select: { id: true } },
          photos: { select: { status: true } },
          documents: { select: { status: true } },
          videos: { select: { status: true } },
          quickMeetings: { select: { id: true } },
        },
      }) as any

      const enriched = (users as any[]).map((u: any) => {
        const photosApproved = (u.photos as any[]).filter((p: any) => p.status === 'APPROVED').length
        const photosReview = (u.photos as any[]).filter((p: any) => p.status === 'IN_REVIEW').length
        const videosApproved = (u.videos as any[]).filter((v: any) => v.status === 'APPROVED').length
        const videosReview = (u.videos as any[]).filter((v: any) => v.status === 'IN_REVIEW').length
        const docsApproved = (u.documents as any[]).filter((d: any) => d.status === 'APPROVED').length
        const quickMeetingsCount = Array.isArray((u as any).quickMeetings) ? (u as any).quickMeetings.length : 0
        return {
          id: u.id,
          nome: u.nome,
          email: u.email,
          ruolo: u.ruolo,
          createdAt: u.createdAt,
          suspended: (u as any).suspended,
          hasEscortProfile: !!u.escortProfile,
          counts: {
            photosApproved, photosReview,
            videosApproved, videosReview,
            docsApproved,
          }
          ,
          quickMeetingsCount,
        }
      })

      return res.json({ users: enriched })
    } catch (error) {
      console.error('❌ GET /admin/users error', error)
      return res.status(500).json({ error: 'Errore interno del server' })
    }
  }

  if (req.method === 'PATCH') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
      const userId = Number(body.userId)
      const action = String(body.action || '')
      if (!Number.isFinite(userId)) return res.status(400).json({ error: 'userId mancante' })

      if (action === 'changeRole') {
        const newRole = String(body.newRole || '').trim()
        if (!newRole) return res.status(400).json({ error: 'newRole mancante' })
        const updated = await prisma.user.update({ where: { id: userId }, data: { ruolo: newRole } })
        return res.json({ user: { id: updated.id, ruolo: updated.ruolo } })
      }

      if (action === 'suspend') {
        const updated = await prisma.user.update({ where: { id: userId }, data: ({ suspended: true } as any) })
        return res.json({ user: { id: updated.id, suspended: true } })
      }
      if (action === 'unsuspend') {
        const updated = await prisma.user.update({ where: { id: userId }, data: ({ suspended: false } as any) })
        return res.json({ user: { id: updated.id, suspended: false } })
      }

      return res.status(400).json({ error: 'Azione non supportata' })
    } catch (error) {
      console.error('❌ PATCH /admin/users error', error)
      return res.status(500).json({ error: 'Errore interno del server' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { userId } = req.query
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'User ID richiesto' })
      }

      const id = parseInt(userId)
      await prisma.$transaction(async (tx) => {
        await tx.review.deleteMany({ where: { OR: [{ authorId: id }, { targetUserId: id }] } })
        await tx.comment.deleteMany({ where: { OR: [{ authorId: id }, { targetUserId: id }] } })
        await tx.profileEvent.deleteMany({ where: { userId: id } })
        await tx.creditOrder.deleteMany({ where: { userId: id } })
        await tx.creditTransaction.deleteMany({ where: { userId: id } })
        await tx.creditWallet.deleteMany({ where: { userId: id } })
        await tx.listing.deleteMany({ where: { userId: id } })
        await tx.document.deleteMany({ where: { userId: id } })
        await tx.photo.deleteMany({ where: { userId: id } })
        await tx.video.deleteMany({ where: { userId: id } })
        await tx.bookingRequest.deleteMany({ where: { userId: id } })
        await tx.bookingSettings.deleteMany({ where: { userId: id } })
        await tx.escortProfile.deleteMany({ where: { userId: id } })
        await tx.agencyProfile.deleteMany({ where: { userId: id } })
        await tx.user.delete({ where: { id } })
      })

      return res.json({ success: true })
    } catch (error: unknown) {
      console.error('❌ Errore eliminazione utente:', error)
      return res.status(500).json({ error: 'Errore interno del server' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
