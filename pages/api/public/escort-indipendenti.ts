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

    // Costruisci filtri dinamici
    const where: any = {
      ruolo: 'escort',
      // Solo escort indipendenti (non agenzie)
      NOT: {
        ruolo: 'agency'
      }
    }

    // Nota: il filtro città sarà implementato quando il campo sarà aggiunto al database

    // Cerca escort indipendenti
    const escorts = await prisma.user.findMany({
      where,
      select: {
        id: true,
        nome: true,
        email: true,
        slug: true,
        createdAt: true,
        // Nota: campo citta sarà aggiunto in futuro al database
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
      take: 50 // Limite per performance
    })

    console.log(`✅ Trovati ${escorts.length} escort indipendenti`)

    // Trasforma i dati per il frontend
    const cittaRandom = ['Milano', 'Roma', 'Napoli', 'Torino', 'Firenze', 'Bologna', 'Bari', 'Palermo'];
    
    const escortsFormatted = escorts.map(escort => {
      const cittaAssegnata = cittaRandom[Math.floor(Math.random() * cittaRandom.length)];
      
      return {
        id: escort.id,
        nome: escort.nome,
        slug: escort.slug,
        citta: cittaAssegnata, // Temporaneo - da sostituire con campo reale dal database
        eta: Math.floor(Math.random() * 15) + 20, // Temporaneo - da sostituire con campo reale
        capelli: ['Biondi', 'Castani', 'Neri', 'Rossi'][Math.floor(Math.random() * 4)], // Temporaneo
        prezzo: Math.floor(Math.random() * 200) + 100, // Temporaneo
        foto: '/placeholder.svg', // Temporaneo - da sostituire con foto reali
        rank: ['VIP', 'ORO', 'TITANIUM', 'ARGENTO'][Math.floor(Math.random() * 4)], // Temporaneo
        tipo: 'indipendente',
        verificata: Math.random() > 0.3, // Temporaneo - 70% verificate
        descrizione: `Escort indipendente di ${cittaAssegnata}`,
        createdAt: escort.createdAt
      };
    })

    return res.status(200).json({
      success: true,
      escorts: escortsFormatted,
      total: escortsFormatted.length,
      filters: {
        citta: citta || null,
        capelli: capelli || null,
        eta_range: eta_min && eta_max ? `${eta_min}-${eta_max}` : null,
        prezzo_range: prezzo_min && prezzo_max ? `${prezzo_min}-${prezzo_max}` : null
      }
    })

  } catch (error: unknown) {
    console.error('❌ ERRORE in /api/public/escort-indipendenti:', error)
    return res.status(500).json({ 
      error: 'Errore interno del server',
      escorts: [],
      total: 0
    })
  }
}
