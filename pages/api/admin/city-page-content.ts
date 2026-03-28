import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  const decoded = token ? verifyToken(token) : null
  if (!decoded) return res.status(401).json({ error: 'Non autorizzato' })
  const me = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { ruolo: true } })
  if (me?.ruolo !== 'admin') return res.status(403).json({ error: 'Accesso negato' })

  const PAGE_TYPE = 'INCONTRI_VELOCI'

  if (req.method === 'GET') {
    const { city } = req.query
    if (city && typeof city === 'string') {
      const item = await prisma.cityPageContent.findUnique({
        where: { city_pageType: { city: city.toUpperCase(), pageType: PAGE_TYPE } }
      })
      return res.json({ item: item || null })
    }
    const items = await prisma.cityPageContent.findMany({
      where: { pageType: PAGE_TYPE },
      orderBy: { city: 'asc' }
    })
    return res.json({ items })
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    const { city, title, introText, faqs } = req.body as {
      city: string
      title?: string
      introText?: string
      faqs?: { question: string; answer: string }[]
    }
    if (!city) return res.status(400).json({ error: 'city richiesta' })
    const cityKey = city.toUpperCase()
    const item = await prisma.cityPageContent.upsert({
      where: { city_pageType: { city: cityKey, pageType: PAGE_TYPE } },
      update: {
        title: title || null,
        introText: introText || null,
        faqs: faqs || [],
      },
      create: {
        city: cityKey,
        pageType: PAGE_TYPE,
        title: title || null,
        introText: introText || null,
        faqs: faqs || [],
      }
    })
    return res.json({ success: true, item })
  }

  if (req.method === 'DELETE') {
    const { city } = req.query
    if (!city || typeof city !== 'string') return res.status(400).json({ error: 'city richiesta' })
    await prisma.cityPageContent.deleteMany({
      where: { city: city.toUpperCase(), pageType: PAGE_TYPE }
    })
    return res.json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
