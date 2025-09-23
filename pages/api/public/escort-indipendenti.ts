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
        escortProfile: { select: { tier: true, cities: true } },
        photos: { where: { status: 'APPROVED' }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 60,
    })

    const escortsFormatted = escorts.map((u) => {
      const city = (() => {
        const c = u.escortProfile?.cities as any
        return (c && (c.base || c.city)) || 'Milano'
      })()
      const foto = u.photos[0]?.url || '/images/placeholder.jpg'
      const rank = u.escortProfile?.tier || 'STANDARD'
      return {
        id: u.id,
        slug: u.slug || `${u.nome?.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-${u.id}`,
        nome: u.nome,
        eta: 25,
        citta: city,
        capelli: undefined,
        prezzo: 100,
        foto,
        rank,
        verificata: true,
        pacchettoAttivo: true,
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
