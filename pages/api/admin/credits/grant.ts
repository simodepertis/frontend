import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

async function requireAdmin(req: NextApiRequest) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null
  const u = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!u) return null
  // Semplice check ruolo admin (coerente con altre API admin)
  if (u.ruolo === 'admin') return payload
  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const adm = await requireAdmin(req)
    if (!adm) return res.status(403).json({ error: 'Non autorizzato' })

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const { targetUserId, email, amount, note } = req.body || {}

    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt === 0) return res.status(400).json({ error: 'Importo non valido' })

    let user = null as null | { id: number }
    if (targetUserId) {
      user = await prisma.user.findUnique({ where: { id: Number(targetUserId) }, select: { id: true } })
    } else if (email) {
      user = await prisma.user.findUnique({ where: { email: String(email) }, select: { id: true } })
    }
    if (!user) return res.status(404).json({ error: 'Utente non trovato' })

    const result = await prisma.$transaction(async (tx) => {
      let wallet = await tx.creditWallet.findUnique({ where: { userId: user!.id } })
      if (!wallet) wallet = await tx.creditWallet.create({ data: { userId: user!.id, balance: 0 } })

      const updated = await tx.creditWallet.update({ where: { userId: user!.id }, data: { balance: { increment: amt } } })
      await tx.creditTransaction.create({
        data: {
          userId: user!.id,
          amount: amt,
          type: 'ADJUST' as any,
          reference: 'ADMIN_MANUAL',
          meta: note ? { note } : undefined,
        },
      })

      return updated
    })

    return res.json({ ok: true, wallet: { userId: result.userId, balance: result.balance } })
  } catch (e) {
    console.error('admin/credits/grant error', e)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
