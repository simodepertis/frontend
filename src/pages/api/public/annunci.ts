import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

// Mapping città internazionali -> country code
const INTERNATIONAL_CITIES: Record<string, string> = {
  // Francia
  'Paris': 'FR', 'Parigi': 'FR', 'Lyon': 'FR', 'Marseille': 'FR', 'Nice': 'FR', 'Nizza': 'FR',
  'Toulouse': 'FR', 'Bordeaux': 'FR', 'Lille': 'FR', 'Strasbourg': 'FR',
  // UK
  'London': 'UK', 'Londra': 'UK', 'Manchester': 'UK', 'Birmingham': 'UK', 'Liverpool': 'UK',
  'Edinburgh': 'UK', 'Glasgow': 'UK', 'Bristol': 'UK',
  // Germania
  'Berlin': 'DE', 'Berlino': 'DE', 'Munich': 'DE', 'Monaco': 'DE', 'Hamburg': 'DE', 'Amburgo': 'DE',
  'Frankfurt': 'DE', 'Francoforte': 'DE', 'Cologne': 'DE', 'Colonia': 'DE', 'Stuttgart': 'DE',
  // Spagna
  'Madrid': 'ES', 'Barcelona': 'ES', 'Barcellona': 'ES', 'Valencia': 'ES', 'Seville': 'ES',
  'Siviglia': 'ES', 'Malaga': 'ES', 'Bilbao': 'ES',
  // Svizzera
  'Zurich': 'CH', 'Zurigo': 'CH', 'Geneva': 'CH', 'Ginevra': 'CH', 'Basel': 'CH', 'Basilea': 'CH',
  'Bern': 'CH', 'Berna': 'CH', 'Lausanne': 'CH', 'Lucerne': 'CH', 'Lugano': 'CH',
  // Olanda
  'Amsterdam': 'NL', 'Rotterdam': 'NL', 'The Hague': 'NL', "L'Aia": 'NL', 'Utrecht': 'NL',
  // Belgio
  'Brussels': 'BE', 'Bruxelles': 'BE', 'Antwerp': 'BE', 'Anversa': 'BE', 'Bruges': 'BE',
  // Altri paesi europei
  'Vienna': 'AT', 'Praga': 'CZ', 'Prague': 'CZ', 'Warsaw': 'PL', 'Varsavia': 'PL',
  'Budapest': 'HU', 'Bucharest': 'RO', 'Bucarest': 'RO', 'Athens': 'GR', 'Atene': 'GR',
  'Lisbon': 'PT', 'Lisbona': 'PT', 'Porto': 'PT', 'Dublin': 'IE', 'Dublino': 'IE',
  // Medio Oriente & Asia
  'Dubai': 'AE', 'Abu Dhabi': 'AE', 'Doha': 'QA', 'Hong Kong': 'HK',
  // Nord America
  'New York': 'US', 'Los Angeles': 'US', 'Miami': 'US', 'Las Vegas': 'US',
  'Toronto': 'CA', 'Montreal': 'CA', 'Vancouver': 'CA',
  // Russia
  'Moscow': 'RU', 'Mosca': 'RU', 'St Petersburg': 'RU', 'San Pietroburgo': 'RU'
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Metodo non consentito' })

  const { country, citta } = req.query
  const filterCountry = country ? String(country).toUpperCase() : null
  const filterCity = citta ? String(citta) : null

  try {
    // Recupera tutti gli utenti escort con profilo
    const users = await prisma.user.findMany({
      where: { 
        ruolo: { in: ['escort', 'agency'] },
        suspended: false
      },
      include: {
        escortProfile: true,
        photos: {
          where: { status: 'APPROVED' },
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      },
      take: 100
    })

    const items = users
      .filter(u => u.escortProfile)
      .map(u => {
        const profile = u.escortProfile!
        const cities = (profile.cities as any) || []
        
        // Estrai countries dalle città internazionali
        const countries: string[] = []
        const intlCities: string[] = []
        
        if (Array.isArray(cities)) {
          cities.forEach((c: string) => {
            const city = String(c).trim()
            // Se contiene virgola, è formato "Città, Paese"
            if (city.includes(',')) {
              const parts = city.split(',').map(p => p.trim())
              if (parts.length >= 2) {
                intlCities.push(parts[0])
                const country = parts[parts.length - 1].toUpperCase()
                if (!countries.includes(country)) {
                  countries.push(country)
                }
              }
            } else {
              // Controlla se è una città internazionale nota (case-insensitive)
              let countryCode = INTERNATIONAL_CITIES[city]
              if (!countryCode) {
                // Prova case-insensitive
                const cityKey = Object.keys(INTERNATIONAL_CITIES).find(k => k.toLowerCase() === city.toLowerCase())
                if (cityKey) countryCode = INTERNATIONAL_CITIES[cityKey]
              }
              
              if (countryCode) {
                intlCities.push(city)
                if (!countries.includes(countryCode)) {
                  countries.push(countryCode)
                }
              } else {
                // Città italiana o non riconosciuta
                intlCities.push(city)
              }
            }
          })
        }

        return {
          id: u.id,
          slug: u.slug || `escort-${u.id}`,
          name: u.nome,
          cities: intlCities,
          countries: countries.length > 0 ? countries : [],
          tier: profile.tier || 'STANDARD',
          isVerified: profile.consentAcceptedAt ? true : false,
          coverUrl: u.photos[0]?.url || null
        }
      })
      .filter(item => {
        // Filtra per country se specificato
        if (filterCountry && !item.countries.includes(filterCountry)) {
          return false
        }
        // Filtra per city se specificato
        if (filterCity && !item.cities.some(c => c.toLowerCase() === filterCity.toLowerCase())) {
          return false
        }
        return true
      })

    return res.status(200).json({ items })
  } catch (err) {
    console.error('API /api/public/annunci errore:', err)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
