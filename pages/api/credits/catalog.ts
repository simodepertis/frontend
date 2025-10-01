import type { NextApiRequest, NextApiResponse } from 'next'

// Hardcoded catalog so UI always has packages, independent of DB
// codes starting with VIP/ORO/ARGENTO/TITANIO are used by the UI for styling
// Two kinds of products are supported by the UI:
// - Fixed price in credits: use creditsCost
// - Variable per day in credits: use pricePerDayCredits + minDays/maxDays

const products = [
  // VIP placements
  { code: 'VIP_HOME', label: 'VIP Home (7 giorni)', creditsCost: 700, durationDays: 7 },
  { code: 'VIP_CATEGORIA', label: 'VIP Categoria (7 giorni)', creditsCost: 420, durationDays: 7 },
  // ORO placements
  { code: 'ORO_HOME', label: 'ORO Home (7 giorni)', creditsCost: 560, durationDays: 7 },
  { code: 'ORO_CATEGORIA', label: 'ORO Categoria (7 giorni)', creditsCost: 350, durationDays: 7 },
  // ARGENTO placements
  { code: 'ARGENTO_HOME', label: 'ARGENTO Home (7 giorni)', creditsCost: 420, durationDays: 7 },
  { code: 'ARGENTO_CATEGORIA', label: 'ARGENTO Categoria (7 giorni)', creditsCost: 280, durationDays: 7 },
  // TITANIO placements (ultimo nella scala)
  { code: 'TITANIO_HOME', label: 'TITANIO Home (7 giorni)', creditsCost: 280, durationDays: 7 },
  { code: 'TITANIO_CATEGORIA', label: 'TITANIO Categoria (7 giorni)', creditsCost: 200, durationDays: 7 },

  // Esempio prodotto a giorni configurabili (mostra input giorni nella UI)
  { code: 'VIP_HOME_DAILY', label: 'VIP Home (al giorno)', pricePerDayCredits: 110, minDays: 3, maxDays: 30, durationDays: 1 },
]

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }
  try {
    return res.status(200).json({ products })
  } catch (e) {
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
