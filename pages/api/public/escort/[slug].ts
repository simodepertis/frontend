import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

function normalizeUrl(u: string | null | undefined): string | null {
  const s = String(u || '')
  if (!s) return null
  if (s.startsWith('/uploads/')) return '/api' + s
  return s
}

function titleCase(s: string) {
  return s.split(/\s+/).filter(Boolean).map(w => w[0]?.toUpperCase() + w.slice(1)).join(' ')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const slug = String(req.query.slug || '')
    if (!slug) return res.status(400).json({ error: 'Slug mancante' })
    const guessName = titleCase(slug.replace(/-/g, ' ').trim())

    // If slug ends with -<id>, try lookup by user id directly (more robust)
    const idMatch = slug.match(/-(\d+)$/)
    const userIdFromSlug = idMatch ? Number(idMatch[1]) : null

    const user = userIdFromSlug
      ? await prisma.user.findUnique({
          where: { id: userIdFromSlug },
          include: {
            escortProfile: {
              select: {
                tier: true,
                tierExpiresAt: true,
                cities: true,
                girlOfTheDayDate: true,
                updatedAt: true,
                services: true,
                rates: true,
                contacts: true,
                languages: true,
                bioIt: true,
                bioEn: true,
              }
            },
            bookingSettings: true,
          }
        })
      : await prisma.user.findFirst({
          where: { OR: [ { slug: slug }, { nome: guessName } ] },
          include: {
            escortProfile: {
              select: {
                tier: true,
                tierExpiresAt: true,
                cities: true,
                girlOfTheDayDate: true,
                updatedAt: true,
                services: true,
                rates: true,
                contacts: true,
                languages: true,
                bioIt: true,
                bioEn: true,
              }
            },
            bookingSettings: true,
          }
        })

    if (!user) return res.status(404).json({ error: 'Profilo non trovato' })

    let photos = await prisma.photo.findMany({ where: { userId: user.id, status: 'APPROVED' as any }, orderBy: { updatedAt: 'desc' }, take: 24 })
    if (photos.length === 0 && process.env.NODE_ENV !== 'production') {
      // In sviluppo, se non ci sono APPROVED, mostra anche bozze/in review per facilitare i test
      photos = await prisma.photo.findMany({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' }, take: 24 })
    }
    const coverUrl = normalizeUrl(photos[0]?.url) || null
    const p: any = (user as any).escortProfile

    return res.json({
      userId: user.id,
      nome: (()=>{
        try { const bx:any = (p?.contacts as any) || {}; return (bx.bioInfo?.nomeProfilo) || user.nome; } catch { return user.nome; }
      })(),
      slug: user.slug,
      cities: p?.cities ?? [],
      tier: p?.tier ?? 'STANDARD',
      tierExpiresAt: p?.tierExpiresAt ?? null,
      girlOfTheDay: p?.girlOfTheDayDate ? (new Date(p.girlOfTheDayDate).toISOString().slice(0,10) === new Date().toISOString().slice(0,10)) : false,
      updatedAt: p?.updatedAt ?? null,
      services: p?.services ?? [],
      rates: p?.rates ?? [],
      contacts: p?.contacts ?? {},
      workingHours: (()=>{ try { return ((p?.contacts as any)?.workingHours) || null; } catch { return null; } })(),
      languages: p?.languages ?? [],
      bio: p?.bioIt ?? p?.bioEn ?? null,
      photos: photos.map(ph => normalizeUrl(ph.url)).filter(Boolean) as string[],
      booking: (user as any).bookingSettings ? {
        enabled: (user as any).bookingSettings.enabled,
        minNotice: (user as any).bookingSettings.minNotice,
        allowedDurations: (user as any).bookingSettings.allowedDurations,
        prices: (user as any).bookingSettings.prices,
        schedule: (user as any).bookingSettings.schedule,
      } : null,
      coverUrl,
    })
  } catch (e) {
    return res.status(500).json({ error: 'Errore interno' })
  }
}
