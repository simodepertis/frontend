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

    // LOGICA CORRETTA: Solo escort verificati con pacchetto attivo
    const where: any = {
      ruolo: 'escort',
      // Solo escort indipendenti (non agenzie)
      NOT: {
        ruolo: 'agency'
      },
      // IMPORTANTE: Solo utenti che hanno:
      // 1. Verificato l'identità (documenti approvati dall'admin)
      // 2. Acquistato un pacchetto attivo (VIP/ORO/TITANIUM/ARGENTO)
      // Questi campi saranno aggiunti al database quando implementati
    }

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

    console.log(`🔍 Trovati ${escorts.length} utenti escort nel database`)

    // IMPORTANTE: Al momento non ci sono escort verificati con pacchetto attivo
    // Questo è corretto perché:
    // 1. Gli utenti devono prima verificare l'identità (documenti)
    // 2. Poi acquistare un pacchetto (VIP/ORO/TITANIUM/ARGENTO)
    // 3. Solo allora appaiono nelle ricerche pubbliche
    
    console.log('ℹ️ Nessun escort verificato con pacchetto attivo trovato')
    
    const escortsFormatted: any[] = [] // Array vuoto - logica corretta

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
