import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { city, pageType } = req.query
  if (!city || !pageType) return res.status(400).json({ error: 'city e pageType richiesti' })

  const cityKey = String(city).toUpperCase()
  const pageTypeKey = String(pageType).toUpperCase()

  const item = await prisma.cityPageContent.findUnique({
    where: { city_pageType: { city: cityKey, pageType: pageTypeKey } }
  })

  return res.json({ item: item || null })
}
