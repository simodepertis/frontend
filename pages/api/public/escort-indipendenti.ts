import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  console.log('🔍 API /api/public/escort-indipendenti chiamata')
  
  try {
    const { citta, capelli, eta_min, eta_max, prezzo_min, prezzo_max } = req.query

    // Mostra escort indipendenti con almeno un documento APPROVATO
    const escorts = await prisma.user.findMany({
      where: {
        ruolo: 'escort',
        documents: { some: { status: 'APPROVED' } },
      },
      select: {
        id: true,
        nome: true,
        slug: true,
        createdAt: true,
        escortProfile: { select: { tier: true, cities: true, girlOfTheDayDate: true, contacts: true } },
        photos: { where: { status: 'APPROVED' }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: [
        { escortProfile: { girlOfTheDayDate: 'desc' } as any }, // Prisma consente orderBy per relazioni 1-1
        { createdAt: 'desc' }
      ],
      take: 60,
    })

    // Aggiungo conteggi video e recensioni
    const escortsWithCounts = await Promise.all(escorts.map(async (u) => {
      const [videoCount, reviewCount] = await Promise.all([
        prisma.video.count({ where: { userId: u.id, status: 'APPROVED' as any } }),
        prisma.review.count({ where: { targetUserId: u.id, status: 'APPROVED' as any } })
      ])
      return { ...u, videoCount, reviewCount }
    }))

    const escortsFormatted = escortsWithCounts.map((u) => {
      const city = (() => {
        const c = u.escortProfile?.cities as any
        return (c && (c.base || c.city || c.baseCity)) || 'Milano'
      })()
      const fotoRaw = u.photos[0]?.url || '/images/placeholder.jpg'
      const foto = fotoRaw.startsWith('/uploads/') ? ('/api' + fotoRaw) : fotoRaw
      const rank = u.escortProfile?.tier || 'STANDARD'
      const girl = (() => {
        const d: any = (u as any).escortProfile?.girlOfTheDayDate
        if (!d) return false
        const today = new Date().toISOString().slice(0,10)
        const dd = new Date(d).toISOString().slice(0,10)
        return dd === today
      })()
      const displayName = (() => {
        try {
          const cts: any = (u.escortProfile as any)?.contacts || {}
          return (cts.bioInfo?.nomeProfilo) || u.nome
        } catch { return u.nome }
      })()
      return {
        id: u.id,
        slug: u.slug || `${u.nome?.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-${u.id}`,
        nome: displayName,
        eta: 25,
        citta: city,
        capelli: undefined,
        prezzo: 100,
        foto,
        rank,
        verificata: true,
        pacchettoAttivo: true,
        girlOfTheDay: girl,
        videoCount: u.videoCount,
        reviewCount: u.reviewCount,
      }
    })

    return res.status(200).json({ success: true, escorts: escortsFormatted, total: escortsFormatted.length })

  } catch (error: unknown) {
    console.error('❌ ERRORE in /api/public/escort-indipendenti:', error)
    return res.status(500).json({ 
      error: 'Errore interno del server',
      escorts: [],
      total: 0
    })
  }
}
