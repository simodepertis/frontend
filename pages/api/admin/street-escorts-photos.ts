import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

async function requireAdmin(req: NextApiRequest) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const u = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!u || u.ruolo !== 'admin') return null;
  return payload;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const adm = await requireAdmin(req);
    if (!adm) return res.status(403).json({ error: 'Non autorizzato' });

    if (req.method === 'GET') {
      const streetEscortId = Number((req.query.streetEscortId as string) || 0);
      if (!streetEscortId) return res.status(400).json({ error: 'streetEscortId richiesto' });
      const photos = await prisma.streetEscortPhoto.findMany({
        where: { streetEscortId },
        orderBy: { createdAt: 'desc' },
      });
      return res.status(200).json({ photos });
    }

    if (req.method === 'POST') {
      const { streetEscortId, url } = req.body || {};
      const sid = Number(streetEscortId || 0);
      if (!sid || !url || typeof url !== 'string') {
        return res.status(400).json({ error: 'streetEscortId e url sono obbligatori' });
      }
      const created = await prisma.streetEscortPhoto.create({
        data: {
          streetEscortId: sid,
          url: String(url),
          // le foto Street Fireflies sono considerate censurate di default
          isCensored: true,
        },
      });
      return res.status(201).json({ photo: created });
    }

    if (req.method === 'DELETE') {
      const idParam = (req.query.id ?? (req.body && (req.body as any).id)) as any;
      const pid = Number(idParam || 0);
      if (!pid) return res.status(400).json({ error: 'ID mancante' });
      await prisma.streetEscortPhoto.delete({ where: { id: pid } });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Metodo non consentito' });
  } catch (err) {
    console.error('API /api/admin/street-escorts-photos errore:', err);
    return res.status(500).json({ error: 'Errore interno' });
  }
}
