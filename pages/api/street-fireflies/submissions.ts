import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

async function requireUser(req: NextApiRequest) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.cookies['auth-token'];
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;

  const me = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, ruolo: true, suspended: true },
  });

  if (!me || me.suspended) return null;

  const role = String(me.ruolo || '').toLowerCase();
  // Only regular users (not escort/agency/admin) can submit pins
  if (role === 'admin' || role === 'escort' || role === 'agenzia' || role === 'agency') return null;

  return { userId: me.id };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const auth = await requireUser(req);
    if (!auth) return res.status(403).json({ error: 'Non autorizzato' });

    if (req.method === 'GET') {
      const items = await prisma.streetEscortSubmission.findMany({
        where: { userId: auth.userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      return res.status(200).json({ items });
    }

    if (req.method === 'POST') {
      const {
        name,
        city,
        address,
        lat,
        lon,
        category,
        shortDescription,
        fullDescription,
        price,
        photoUrl,
      } = req.body || {};

      const nm = String(name || '').trim();
      const ct = String(city || '').trim();
      const cat = String(category || 'ESCORT').trim() || 'ESCORT';
      const latNum = typeof lat === 'number' ? lat : Number(lat);
      const lonNum = typeof lon === 'number' ? lon : Number(lon);
      const priceNum = price === null || price === undefined || String(price).trim() === '' ? null : Number(price);

      const addr = address ? String(address).trim() : '';

      let photo: string | null = null;
      if (photoUrl !== null && photoUrl !== undefined && String(photoUrl).trim() !== '') {
        const raw = String(photoUrl);
        if (!raw.startsWith('data:image/')) {
          return res.status(400).json({ error: 'Formato foto non valido' });
        }
        // Limite base64 per evitare payload enormi
        const MAX_BASE64_LEN = 3.5 * 1024 * 1024;
        if (raw.length > MAX_BASE64_LEN) {
          return res.status(413).json({ error: 'Foto troppo grande (comprimi l\'immagine)' });
        }
        photo = raw;
      }

      if (!nm || !ct) return res.status(400).json({ error: 'Nome e città sono obbligatori' });
      if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) {
        return res.status(400).json({ error: 'Latitudine/Longitudine non valide' });
      }
      if (priceNum !== null && !Number.isFinite(priceNum)) {
        return res.status(400).json({ error: 'Prezzo non valido' });
      }

      const created = await prisma.streetEscortSubmission.create({
        data: {
          userId: auth.userId,
          name: nm,
          city: ct,
          address: addr || null,
          lat: latNum,
          lon: lonNum,
          category: cat,
          shortDescription: shortDescription ? String(shortDescription) : null,
          fullDescription: fullDescription ? String(fullDescription) : null,
          price: priceNum === null ? null : Math.trunc(priceNum),
          photoUrl: photo,
          status: 'PENDING',
        },
      });

      return res.status(201).json({ item: created });
    }

    return res.status(405).json({ error: 'Metodo non consentito' });
  } catch (err) {
    console.error('API /api/street-fireflies/submissions errore:', err);
    return res.status(500).json({ error: 'Errore interno' });
  }
}
