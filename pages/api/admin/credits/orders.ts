import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function isAdminEmail(email: string) {
  const whitelist = new Set(['admin@local', 'musicamagazine23@gmail.com'])
  return whitelist.has(email)
}

async function requireAdmin(req: NextApiRequest) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null
  const u = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!u) return null
  if (u.ruolo === 'admin' || isAdminEmail(u.email)) return payload
  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const adm = await requireAdmin(req)
  if (!adm) return res.status(403).json({ error: 'Non autorizzato' })

  try {
    if (req.method === 'GET') {
      const status = String(req.query.status || 'PENDING').toUpperCase()
      const orders = await prisma.creditOrder.findMany({ where: { status: status as any }, orderBy: { createdAt: 'desc' }, take: 100 })
      return res.json({ orders })
    }

    if (req.method === 'PATCH') {
      const id = Number((req.body as any)?.id || 0)
      const action = String((req.body as any)?.action || '').toLowerCase() // 'approve' | 'reject'
      if (!id || !['approve', 'reject'].includes(action)) return res.status(400).json({ error: 'Parametri non validi' })

      if (action === 'approve') {
        const result = await prisma.$transaction(async (tx) => {
          const order = await tx.creditOrder.update({ where: { id }, data: { status: 'PAID' } })
          let wallet = await tx.creditWallet.findUnique({ where: { userId: order.userId } })
          if (!wallet) wallet = await tx.creditWallet.create({ data: { userId: order.userId, balance: 0 } })
          await tx.creditTransaction.create({ data: { userId: order.userId, amount: order.credits, type: 'PURCHASE', reference: order.method.toUpperCase() } })
          const updatedWallet = await tx.creditWallet.update({ where: { userId: order.userId }, data: { balance: { increment: order.credits } } })
          return { order, wallet: updatedWallet }
        })
        return res.json({ ok: true, order: result.order, wallet: { balance: result.wallet.balance } })
      } else {
        const order = await prisma.creditOrder.update({ where: { id }, data: { status: 'FAILED' } })
        return res.json({ ok: true, order })
      }
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    return res.status(500).json({ error: 'Errore interno' })
  }
}
