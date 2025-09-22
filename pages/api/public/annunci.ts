import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

function tierPriority(tier: string, isGirlOfDay: boolean) {
  if (tier === 'VIP') return 100
  if (isGirlOfDay) return 90
  if (tier === 'TITANIO') return 80
  if (tier === 'ORO') return 70
  if (tier === 'ARGENTO') return 60
  return 0
}

function kebab(s: string) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const city = String(req.query.citta || '').trim().toLowerCase()
    const type = String(req.query.type || '').trim().toUpperCase() // VIRTUAL|PHYSICAL
    const page = Math.max(1, Number(req.query.page || 1))
    const q = String(req.query.q || '').trim().toLowerCase()
    const pageSize = 40

    let mapped: any[] = []
    const todayStr = new Date().toISOString().slice(0, 10)

    if (type === 'VIRTUAL') {
      const listings = await prisma.listing.findMany({
        where: { status: 'PUBLISHED', type: 'VIRTUAL' as any },
        include: { user: { select: { id: true, nome: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
      })
      mapped = (listings as any[]).map((l: any) => {
        const slug = l.user?.slug || `${kebab(l.user?.nome || '')}-${l.user?.id}`
        const cities = [l.city].filter(Boolean)
        return {
          id: l.userId,
          name: l.title || l.user?.nome || `User ${l.userId}`,
          slug,
          cities,
          tier: 'STANDARD',
          girlOfTheDay: false,
          priority: 0,
          updatedAt: l.createdAt,
        }
      }).filter((x: any) => (!city || x.cities.some((c: string) => String(c).toLowerCase().includes(city))) && (!q || String(x.name).toLowerCase().includes(q) || x.cities.some((c: string) => String(c).toLowerCase().includes(q))))
    } else {
      // Profili escort (annunci fisici)
      const profiles = await prisma.escortProfile.findMany({
        include: { user: { select: { id: true, nome: true, slug: true } } },
        orderBy: { updatedAt: 'desc' },
      })

      // Mappa profili base
      const base = profiles.map((p: any) => {
        const cities = Array.isArray(p.cities) ? (p.cities as any[]) : []
        const isGirl = p.girlOfTheDayDate ? p.girlOfTheDayDate.toISOString().slice(0, 10) === todayStr : false
        const prio = tierPriority(p.tier as any, isGirl)
        const slug = p.user?.slug || `${kebab(p.user?.nome || '')}-${p.user?.id}`
        return {
          id: p.userId,
          name: p.user?.nome || `User ${p.userId}`,
          slug,
          cities,
          tier: p.tier,
          girlOfTheDay: isGirl,
          priority: prio,
          updatedAt: p.updatedAt,
        } as any
      }).filter((x: any) => (!city || x.cities.length === 0 || x.cities.some((c: any) => String(c).toLowerCase().includes(city))) && (!q || String(x.name).toLowerCase().includes(q) || (Array.isArray(x.cities) && x.cities.some((c: any) => String(c).toLowerCase().includes(q)))))

      // Allego cover APPROVED e calcolo verified
      const withMeta = await Promise.all(base.map(async (it: any) => {
        const cover = await prisma.photo.findFirst({ where: { userId: it.id, status: 'APPROVED' as any }, orderBy: { updatedAt: 'desc' } })
        const docs = await prisma.document.findMany({
          where: { userId: it.id, status: 'APPROVED' as any, type: { in: ['ID_CARD_FRONT', 'ID_CARD_BACK', 'SELFIE_WITH_ID'] as any } },
          select: { type: true }
        })
        const docTypes = new Set(docs.map(d => d.type))
        const hasAllKyc = docTypes.has('ID_CARD_FRONT') && docTypes.has('ID_CARD_BACK') && docTypes.has('SELFIE_WITH_ID')
        const isVerified = Boolean(cover) && hasAllKyc
        return { ...it, coverUrl: cover?.url || null, isVerified }
      }))

      // PUBBLICAZIONE: mostra solo chi ha almeno una foto APPROVED (coverUrl non null)
      mapped = withMeta.filter(x => x.coverUrl)
    }

    // Sort by priority desc then updatedAt desc
    mapped.sort((a, b) => (b.priority - a.priority) || (new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()))

    const total = mapped.length
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const pageItems = mapped.slice(start, end)

    return res.json({ total, page, pageSize, items: pageItems })
  } catch (e) {
    return res.status(500).json({ error: 'Errore interno' })
  }
}
