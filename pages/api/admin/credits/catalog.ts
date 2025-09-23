import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { Prisma } from '@prisma/client'

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
      if (!code || !label) {
        return res.status(400).json({ error: 'Codice e label sono obbligatori' })
      }
      const cc = Number(creditsCost)
      const dd = Number(durationDays)
      if (!Number.isFinite(cc) || cc <= 0) return res.status(400).json({ error: 'Crediti non validi' })
      if (!Number.isFinite(dd) || dd <= 0) return res.status(400).json({ error: 'Durata (giorni) non valida' })
      try {
        const created = await prisma.creditProduct.create({
          data: {
            code: String(code),
            label: String(label),
            creditsCost: cc,
            durationDays: dd,
            pricePerDayCredits: pricePerDayCredits != null && pricePerDayCredits !== '' ? Number(pricePerDayCredits) : null,
            minDays: minDays != null && minDays !== '' ? Number(minDays) : null,
            maxDays: maxDays != null && maxDays !== '' ? Number(maxDays) : null,
          }
        })
        return res.json({ product: created })
      } catch (e:any) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          return res.status(409).json({ error: 'Codice già esistente. Modifica il pacchetto esistente nelle card sotto.' })
        }
        console.error('Create product error', e)
        return res.status(500).json({ error: 'Errore interno' })
      }
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
