import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Metodo non consentito' });

  const { country, citta } = req.query;
  const filterCountry = country ? String(country).toUpperCase() : null;
  const filterCity = citta ? String(citta).toLowerCase() : null;

  try {
    const users = await prisma.user.findMany({
      where: {
        ruolo: { in: ['escort', 'agency'] },
        suspended: false,
      },
      include: {
        escortProfile: true,
        photos: {
          where: { status: 'APPROVED' },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      take: 300,
    });

    const items = users
      .filter((u) => u.escortProfile)
      .map((u) => {
        const profile: any = u.escortProfile;
        const citiesJson: any = profile.cities || {};

        // Estrai lista completa di città e paesi (stessa logica di /api/public/annunci)
        let flatCities: string[] = [];
        if (Array.isArray(citiesJson)) {
          flatCities = citiesJson as string[];
        } else if (citiesJson && typeof citiesJson === 'object') {
          const collected: string[] = [];

          // Vecchio formato internazionale
          if (citiesJson.intlBaseCity) collected.push(citiesJson.intlBaseCity);
          if (citiesJson.intlSecondCity) collected.push(citiesJson.intlSecondCity);
          if (citiesJson.intlThirdCity) collected.push(citiesJson.intlThirdCity);
          if (citiesJson.intlFourthCity) collected.push(citiesJson.intlFourthCity);
          if (Array.isArray(citiesJson.internationalCities)) {
            collected.push(...(citiesJson.internationalCities as any[]));
          }

          // Nuovo formato città di lavoro
          if (citiesJson.baseCity) collected.push(citiesJson.baseCity);
          if (citiesJson.secondCity) collected.push(citiesJson.secondCity);
          if (citiesJson.thirdCity) collected.push(citiesJson.thirdCity);
          if (citiesJson.fourthCity) collected.push(citiesJson.fourthCity);
          if (Array.isArray(citiesJson.cities)) {
            collected.push(...(citiesJson.cities as any[]));
          }

          flatCities = collected.filter(Boolean);
        }

        const countries: string[] = [];
        const cityNamesForFilter: string[] = [];

        if (Array.isArray(flatCities)) {
          flatCities.forEach((c: string) => {
            const city = String(c).trim();
            if (city.includes(',')) {
              // formato "City, COUNTRY_CODE"
              const parts = city.split(',').map((p) => p.trim());
              if (parts.length >= 2) {
                cityNamesForFilter.push(parts[0]);
                const cc = parts[parts.length - 1].toUpperCase();
                if (!countries.includes(cc)) countries.push(cc);
              }
            } else {
              cityNamesForFilter.push(city);
            }
          });
        }

        // posizione precisa se l'utente ha selezionato la via sulla mappa
        let lat: number | null = null;
        let lon: number | null = null;
        try {
          if (citiesJson.position && typeof citiesJson.position.lat === 'number' && typeof citiesJson.position.lng === 'number') {
            lat = citiesJson.position.lat;
            lon = citiesJson.position.lng;
          }
        } catch {}

        // categoria stimata (escort / trans / coppie) in base alle info profilo
        let category: 'ESCORT' | 'TRANS' | 'COPPIE' | 'ALTRO' = 'ESCORT';
        try {
          const bioInfo = (profile.contacts as any)?.bioInfo || {};
          const sesso = String(bioInfo.sesso || '').toLowerCase();
          const tipoProfilo = String(bioInfo.tipoProfilo || '').toLowerCase();
          if (sesso.includes('trans') || tipoProfilo.includes('trans')) category = 'TRANS';
          if (tipoProfilo.includes('coppia') || sesso.includes('coppia')) category = 'COPPIE';
        } catch {}

        return {
          id: u.id,
          slug: u.slug || `escort-${u.id}`,
          name: u.nome,
          cities: cityNamesForFilter,
          countries,
          lat,
          lon,
          category,
          coverUrl: u.photos[0]?.url || null,
        };
      })
      .filter((item) => {
        const hasPosition = typeof item.lat === 'number' && typeof item.lon === 'number';

        // COUNTRY: se non ha posizione, filtriamo per country normalmente.
        // Se ha posizione precisa, NON lo escludiamo per country: la mappa è guidata da lat/lon.
        if (filterCountry && !hasPosition && !item.countries.includes(filterCountry)) return false;

        // CITY: se non ha posizione, filtriamo per city testuale.
        // Se ha posizione, non lo escludiamo per differenza di nome città.
        if (filterCity && !hasPosition) {
          const cityMatches = item.cities.some((c: string) => c.toLowerCase() === filterCity);
          if (!cityMatches) return false;
        }

        return true;
      });

    return res.status(200).json({ items });
  } catch (err) {
    console.error('API /api/public/escort-map errore:', err);
    return res.status(500).json({ error: 'Errore interno' });
  }
}
