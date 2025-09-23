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
  const whitelist = new Set(['admin@local', 'musicamagazine23@gmail.com'])
  if (u.ruolo === 'admin' || (u.email && whitelist.has(u.email))) return payload
  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const adm = await requireAdmin(req)
    if (!adm) return res.status(403).json({ error: 'Non autorizzato' })

    if (req.method === 'GET') {
      const products = await prisma.creditProduct.findMany({ orderBy: { updatedAt: 'desc' } })
      return res.json({ products })
    }

    if (req.method === 'POST') {
      const { code, label, creditsCost, durationDays, pricePerDayCredits, minDays, maxDays } = req.body || {}
      if (!code || !label || !Number.isFinite(creditsCost) || !Number.isFinite(durationDays)) {
        return res.status(400).json({ error: 'Campi mancanti' })
      }
      const created = await prisma.creditProduct.create({
        data: {
          code: String(code),
          label: String(label),
          creditsCost: Number(creditsCost),
          durationDays: Number(durationDays),
          pricePerDayCredits: pricePerDayCredits != null ? Number(pricePerDayCredits) : null,
          minDays: minDays != null ? Number(minDays) : null,
          maxDays: maxDays != null ? Number(maxDays) : null,
        }
      })
      return res.json({ product: created })
    }

    if (req.method === 'PATCH') {
      const { id, ...patch } = (req.body || {}) as any
      const pid = Number(id)
      if (!pid) return res.status(400).json({ error: 'ID mancante' })
      const data: any = {}
      for (const k of ['code','label','creditsCost','durationDays','active','pricePerDayCredits','minDays','maxDays']) {
        if (k in patch) data[k] = patch[k]
      }
      const updated = await prisma.creditProduct.update({ where: { id: pid }, data })
      return res.json({ product: updated })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (e) {
    console.error('❌ admin/credits/catalog error', e)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
