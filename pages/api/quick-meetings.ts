import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

function normalizeUploadUrl(u: string | null | undefined): string {
  const s = String(u || '').trim()
  if (!s) return ''
  if (s.startsWith('/uploads/')) return `/api${s}`
  return s
}

function sanitizePhotos(input: any): string[] {
  let arr: any[] = []
  if (Array.isArray(input)) {
    arr = input
  } else if (typeof input === 'string') {
    const s = input.trim()
    if (!s) return []
    if (s.startsWith('[')) {
      try {
        const parsed = JSON.parse(s)
        if (Array.isArray(parsed)) arr = parsed
        else arr = [s]
      } catch {
        arr = [s]
      }
    } else {
      arr = [s]
    }
  } else if (input && typeof input === 'object') {
    const maybe = (input as any).photos
    if (Array.isArray(maybe)) arr = maybe
  }

  return arr
    .filter((x) => typeof x === 'string')
    .map((x) => String(x).trim())
    .filter((x) => x.length > 0)
    .filter((x) => !x.startsWith('data:'))
    .filter((x) => x.length < 8192)
    .map((x) => normalizeUploadUrl(x))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { category, city, page = '1', limit = '50' } = req.query
    
    const pageNum = Math.max(1, parseInt(page as string))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)))
    const offset = (pageNum - 1) * limitNum
    const now = new Date()

    // Auto-heal: se esistono acquisti SuperTop attivi, assicura bumpPackage='SUPERTOP' sul meeting.
    // Serve per correggere acquisti storici quando il codice prodotto era 'SUPERTOP' (senza underscore)
    // e non veniva riconosciuto dal backend.
    try {
      const superPurchases = await prisma.quickMeetingPurchase.findMany({
        where: {
          status: 'ACTIVE',
          expiresAt: { gt: now },
          OR: [
            { product: { code: 'SUPERTOP' } },
            { product: { code: { startsWith: 'SUPERTOP_' } } },
          ],
        },
        select: { meetingId: true },
        take: 500,
      })
      const ids = Array.from(new Set(superPurchases.map((p) => p.meetingId))).filter(Boolean)
      if (ids.length) {
        await prisma.quickMeeting.updateMany({
          where: { id: { in: ids }, bumpPackage: { not: 'SUPERTOP' } },
          data: { bumpPackage: 'SUPERTOP' },
        })
      }
    } catch {
      // non bloccare la lista pubblica se l'auto-heal fallisce
    }

    // Costruisci filtri
    const whereBase: any = {
      isActive: true,
      // Mostra annunci non scaduti. Se expiresAt è null, consideralo non scaduto.
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
    }

    if (category && category !== 'ALL') {
      whereBase.category = category
    }

    if (city && city !== 'ALL') {
      whereBase.city = {
        equals: city,
        mode: 'insensitive'
      }
    }

    const whereSuperTop: any = {
      ...whereBase,
      bumpPackage: 'SUPERTOP',
    }

    const whereNormal: any = {
      ...whereBase,
      OR: [
        // mantieni la regola di scadenza
        ...(Array.isArray(whereBase.OR) ? whereBase.OR : []),
      ],
      AND: [
        {
          OR: [
            { bumpPackage: null },
            { bumpPackage: { not: 'SUPERTOP' } },
          ],
        },
      ],
    }

    // Conta totale
    const [superTopTotal, normalTotal] = await Promise.all([
      prisma.quickMeeting.count({ where: whereSuperTop }),
      prisma.quickMeeting.count({ where: whereNormal }),
    ])

    const total = superTopTotal + normalTotal

    // Recupera annunci ordinati per bump e data
    const selectFields = {
      id: true,
      artistName: true,
      title: true,
      description: true,
      category: true,
      city: true,
      zone: true,
      phone: true,
      whatsapp: true,
      telegram: true,
      age: true,
      price: true,
      photos: true,
      publishedAt: true,
      bumpPackage: true,
      bumpCount: true,
      maxBumps: true,
      views: true,
      userId: true,
      user: {
        select: {
          nome: true,
        },
      },
    } as const

    const [superTopMeetings, normalMeetings] = await Promise.all([
      prisma.quickMeeting.findMany({
        where: whereSuperTop,
        orderBy: [
          { publishedAt: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 50,
        select: selectFields,
      }),
      prisma.quickMeeting.findMany({
        where: whereNormal,
        orderBy: [
          // Prima i promossi (escluso SUPERTOP): bumpPackage valorizzato deve stare in alto
          { bumpPackage: 'desc' },
          // Poi i più recenti
          { publishedAt: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: offset,
        take: limitNum,
        select: selectFields,
      }),
    ])

    const meetings = [...superTopMeetings, ...normalMeetings].map((m: any) => ({
      ...m,
      photos: sanitizePhotos(m?.photos),
    }))

    // Statistiche per categoria
    const categoryStats = await prisma.quickMeeting.groupBy({
      by: ['category'],
      where: {
        ...whereBase,
      },
      _count: true
    })

    // Città disponibili
    const cityStats = await prisma.quickMeeting.groupBy({
      by: ['city'],
      where: {
        ...whereBase,
      },
      _count: true,
      orderBy: {
        _count: {
          city: 'desc'
        }
      }
    })

    return res.json({
      meetings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        // Paginazione basata sugli annunci normali. I SuperTop sono sempre aggiunti in cima.
        pages: Math.ceil(normalTotal / limitNum)
      },
      stats: {
        categories: categoryStats,
        cities: cityStats.slice(0, 20) // Top 20 città
      }
    })

  } catch (error) {
    console.error('Errore API quick-meetings:', error)
    return res.status(500).json({ error: 'Errore interno del server' })
  }
}
