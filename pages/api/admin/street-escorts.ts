import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

async function requireAdmin(req: NextApiRequest) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null
  const u = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!u || u.ruolo !== 'admin') return null
  return payload
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const adm = await requireAdmin(req)
    if (!adm) return res.status(403).json({ error: 'Non autorizzato' })

    if (req.method === 'GET') {
      const items = await prisma.streetEscort.findMany({
        orderBy: { id: 'desc' },
        take: 200,
      })
      return res.json({ items })
    }

    if (req.method === 'POST') {
      const { name, city, lat, lon, shortDescription, fullDescription, price, active, category } = req.body || {}
      if (!name || !city) return res.status(400).json({ error: 'Nome e città sono obbligatori' })
      const created = await prisma.streetEscort.create({
        data: {
          name: String(name),
          city: String(city),
          lat: typeof lat === 'number' ? lat : null,
          lon: typeof lon === 'number' ? lon : null,
          category: category ? String(category) : 'ESCORT',
          shortDescription: shortDescription ? String(shortDescription) : null,
          fullDescription: fullDescription ? String(fullDescription) : null,
          price: typeof price === 'number' ? price : null,
          active: typeof active === 'boolean' ? active : true,
        },
      })
      return res.status(201).json({ item: created })
    }

    if (req.method === 'PATCH') {
      const { id, ...rest } = req.body || {}
      const sid = Number(id || 0)
      if (!sid) return res.status(400).json({ error: 'ID mancante' })

      const data: any = {}
      if (rest.name !== undefined) data.name = String(rest.name)
      if (rest.city !== undefined) data.city = String(rest.city)
      if (rest.lat !== undefined) data.lat = typeof rest.lat === 'number' ? rest.lat : null
      if (rest.lon !== undefined) data.lon = typeof rest.lon === 'number' ? rest.lon : null
      if (rest.shortDescription !== undefined) data.shortDescription = rest.shortDescription ? String(rest.shortDescription) : null
      if (rest.fullDescription !== undefined) data.fullDescription = rest.fullDescription ? String(rest.fullDescription) : null
      if (rest.price !== undefined) data.price = typeof rest.price === 'number' ? rest.price : null
      if (rest.active !== undefined) data.active = !!rest.active
      if (rest.category !== undefined) data.category = rest.category ? String(rest.category) : 'ESCORT'

      const updated = await prisma.streetEscort.update({ where: { id: sid }, data })
      return res.json({ item: updated })
    }

    if (req.method === 'DELETE') {
      const idParam = (req.query.id ?? (req.body && (req.body as any).id)) as any
      const sid = Number(idParam || 0)
      if (!sid) return res.status(400).json({ error: 'ID mancante' })
      await prisma.streetEscort.delete({ where: { id: sid } })
      return res.json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('❌ /api/admin/street-escorts errore', error)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
