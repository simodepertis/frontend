import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

async function requireAdmin(req: NextApiRequest) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const u = await prisma.user.findUnique({ where: { id: payload.userId }, select: { id: true, ruolo: true } });
  if (!u || u.ruolo !== 'admin') return null;
  return { userId: u.id };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const adm = await requireAdmin(req);
    if (!adm) return res.status(403).json({ error: 'Non autorizzato' });

    if (req.method === 'GET') {
      const status = String((req.query.status as string) || '').trim();
      const where: any = {};
      if (status) where.status = status;

      const items = await prisma.streetEscortSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: {
          user: { select: { id: true, email: true, nome: true } },
          streetEscort: { select: { id: true, name: true } },
        },
      });
      return res.status(200).json({ items });
    }

    if (req.method === 'PATCH') {
      const { id, action, adminNote } = req.body || {};
      const sid = Number(id || 0);
      if (!sid) return res.status(400).json({ error: 'ID mancante' });

      const submission = await prisma.streetEscortSubmission.findUnique({ where: { id: sid } });
      if (!submission) return res.status(404).json({ error: 'Richiesta non trovata' });

      const act = String(action || '').toUpperCase();
      if (act !== 'APPROVE' && act !== 'REJECT') {
        return res.status(400).json({ error: 'Azione non valida' });
      }

      if (submission.status !== 'PENDING') {
        return res.status(400).json({ error: 'La richiesta è già stata lavorata' });
      }

      if (act === 'REJECT') {
        const updated = await prisma.streetEscortSubmission.update({
          where: { id: sid },
          data: {
            status: 'REJECTED',
            adminNote: adminNote ? String(adminNote) : null,
            reviewedAt: new Date(),
            reviewedById: adm.userId,
          },
        });
        return res.status(200).json({ item: updated });
      }

      // APPROVE: create StreetEscort and link to submission
      const created = await prisma.streetEscort.create({
        data: {
          name: submission.name,
          city: submission.city,
          lat: submission.lat,
          lon: submission.lon,
          category: submission.category || 'ESCORT',
          shortDescription: submission.shortDescription,
          fullDescription: submission.fullDescription,
          price: submission.price,
          active: true,
        },
      });

      // If user attached a pending photo (base64 data URL), persist it as StreetEscortPhoto
      try {
        const raw = (submission as any)?.photoUrl;
        if (raw && typeof raw === 'string' && raw.startsWith('data:image/')) {
          await prisma.streetEscortPhoto.create({
            data: {
              streetEscortId: created.id,
              url: raw,
              isCensored: true,
            },
          });
        }
      } catch (e) {
        console.error('Errore creazione foto Street Fireflies da submission:', e);
      }

      const updated = await prisma.streetEscortSubmission.update({
        where: { id: sid },
        data: {
          status: 'APPROVED',
          adminNote: adminNote ? String(adminNote) : null,
          reviewedAt: new Date(),
          reviewedById: adm.userId,
          streetEscortId: created.id,
        },
      });

      return res.status(200).json({ item: updated, streetEscort: created });
    }

    return res.status(405).json({ error: 'Metodo non consentito' });
  } catch (err) {
    console.error('API /api/admin/street-fireflies-submissions errore:', err);
    return res.status(500).json({ error: 'Errore interno' });
  }
}
