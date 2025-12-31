import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Metodo non consentito' });

  try {
    const users = await prisma.user.findMany({
      where: {
        ruolo: { in: ['escort', 'agency'] },
        suspended: false,
      },
      include: {
        escortProfile: true,
        photos: {
          where: { status: { in: ['APPROVED', 'IN_REVIEW'] } },
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
          cities: [],
          countries: [],
          lat,
          lon,
          category,
          coverUrl: u.photos[0]?.url || null,
        };
      })
      .filter((item) => typeof item.lat === 'number' && typeof item.lon === 'number');

    return res.status(200).json({ items });
  } catch (err) {
    console.error('API /api/public/escort-map errore:', err);
    return res.status(500).json({ error: 'Errore interno' });
  }
}
