import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

function pickPriceFromRates(rates: any): number | null {
  if (!rates || typeof rates !== 'object') return null;
  const preferredKeys = ['hour_1', 'hour1', '60', '30', 'mezzora', '1h', '2h'];
  for (const k of preferredKeys) {
    const v = (rates as any)[k];
    const num = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v.replace(/[^0-9]/g, '')) : NaN);
    if (!Number.isNaN(num) && num > 0) return num;
  }
  let min: number | null = null;
  for (const v of Object.values(rates)) {
    const num = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v.replace(/[^0-9]/g, '')) : NaN);
    if (!Number.isNaN(num) && num > 0) min = min === null ? num : Math.min(min, num);
  }
  return min;
}

function normalizeUrl(u: string | null | undefined): string {
  const s = String(u || '');
  if (s.startsWith('/uploads/')) return '/api' + s;
  try {
    const url = new URL(s);
    if (url.pathname.startsWith('/uploads/')) {
      return '/api' + url.pathname;
    }
  } catch {}
  return s;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const perPage = Math.min(48, Math.max(1, Number(req.query.perPage || 12)));
    const city = String(req.query.city || '').trim().toLowerCase();
    const tag = String(req.query.tag || '').trim().toLowerCase();

    const videos = await prisma.video.findMany({
      where: { status: 'APPROVED' as any },
      orderBy: { updatedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            nome: true,
            escortProfile: { select: { cities: true, rates: true } },
            documents: { select: { status: true } },
          }
        }
      }
    });

    const itemsBase = videos.map((v) => {
      const cities = Array.isArray(v.user?.escortProfile?.cities) ? (v.user?.escortProfile?.cities as any[]) : [];
      const firstCity = cities.length ? String(cities[0]) : '—';
      const hasApprovedDoc = Array.isArray(v.user?.documents) && v.user?.documents?.some(d => d.status === 'APPROVED');
      const price = pickPriceFromRates(v.user?.escortProfile?.rates as any);
      const isNew = v.createdAt && (Date.now() - new Date(v.createdAt).getTime()) < (7 * 24 * 60 * 60 * 1000);
      const thumbUrl = (() => {
        const t = String((v as any).thumb || '');
        const isImage = /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(t);
        return isImage ? normalizeUrl(t) : '/placeholder.svg';
      })();
      return {
        id: v.id,
        url: normalizeUrl(v.url),
        thumb: thumbUrl,
        title: v.title || v.user?.nome || 'Video',
        status: v.status,
        userId: v.userId,
        city: firstCity,
        verified: hasApprovedDoc,
        price: price || 0,
        hd: (v as any).hd || false,
        isNew: isNew,
        duration: (v as any).duration || '—',
      };
    });

    const filtered = itemsBase.filter(it => (
      (!city || String(it.city).toLowerCase().includes(city)) &&
      (!tag || (tag === 'verificata' ? it.verified : (tag === 'hd' ? it.hd : (tag === 'nuova' ? it.isNew : true))))
    ));

    const total = filtered.length;
    const start = (page - 1) * perPage;
    const pageItems = filtered.slice(start, start + perPage);

    return res.status(200).json({ items: pageItems, total, page, perPage });
  } catch (e) {
    return res.status(500).json({ error: 'Errore interno' });
  }
}
