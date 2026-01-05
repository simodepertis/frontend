import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

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
    const where: any = {
      isActive: true,
      // Mostra annunci non scaduti. Se expiresAt è null, consideralo non scaduto.
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
    }

    if (category && category !== 'ALL') {
      where.category = category
    }

    if (city && city !== 'ALL') {
      where.city = {
        equals: city,
        mode: 'insensitive'
      }
    }

    // Conta totale
    const total = await prisma.quickMeeting.count({ where })

    // Recupera annunci ordinati per bump e data
    const meetings = await prisma.quickMeeting.findMany({
      where,
      orderBy: [
        // Prima i promossi: bumpPackage valorizzato (SUPERTOP e altri) deve stare in alto
        { bumpPackage: 'desc' },
        // Poi i più recenti
        { publishedAt: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: offset,
      take: limitNum,
      select: {
        id: true,
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
        views: true
      }
    })

    // Statistiche per categoria
    const categoryStats = await prisma.quickMeeting.groupBy({
      by: ['category'],
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      _count: true
    })

    // Città disponibili
    const cityStats = await prisma.quickMeeting.groupBy({
      by: ['city'],
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
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
        pages: Math.ceil(total / limitNum)
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
