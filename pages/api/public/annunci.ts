import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

function tierPriority(tier: string, isGirlOfDay: boolean) {
  // VIP > GirlOfDay(today) > TITANIO > ORO > ARGENTO > STANDARD
  if (tier === 'VIP') return 100;
  if (isGirlOfDay) return 90;
  if (tier === 'TITANIO') return 80;
  if (tier === 'ORO') return 70;
  if (tier === 'ARGENTO') return 60;
  return 0;
}

function kebab(s: string) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  console.log('🏠 API /api/public/annunci chiamata (Pages Router)')
  
  try {
    const { citta, type, page = '1', q } = req.query;
    const city = (citta as string || '').trim().toLowerCase();
    const typeFilter = (type as string || '').trim().toUpperCase(); // VIRTUAL|PHYSICAL
    const pageNum = Math.max(1, Number(page));
    const query = (q as string || '').trim().toLowerCase();
    const pageSize = 40;

    let mapped: any[] = [];
    const todayStr = new Date().toISOString().slice(0,10);

    if (typeFilter === 'VIRTUAL') {
      // Usa i Listing virtuali pubblicati
      const listings = await (prisma as any).listing.findMany({
        where: { status: 'PUBLISHED' as any, type: 'VIRTUAL' as any },
        include: { user: { select: { id: true, nome: true, slug: true }, }, },
        orderBy: { createdAt: 'desc' },
      });
      mapped = (listings as any[]).map((l: any) => {
        const slug = l.user?.slug || `${kebab(l.user?.nome || '')}-${l.user?.id}`;
        const cities = [l.city].filter(Boolean);
        return {
          id: l.userId,
          name: l.title || l.user?.nome || `User ${l.userId}`,
          slug,
          cities,
          tier: 'STANDARD',
          girlOfTheDay: false,
          priority: 0,
          updatedAt: l.createdAt,
        };
      }).filter((x: any) => (!city || x.cities.some((c: string)=> String(c).toLowerCase().includes(city))) && (!query || String(x.name).toLowerCase().includes(query) || x.cities.some((c: string)=> String(c).toLowerCase().includes(query))));
    } else {
      // Profili escort (annunci fisici)
      const profiles = await prisma.escortProfile.findMany({
        include: { user: { select: { id: true, nome: true, slug: true } } },
        orderBy: { updatedAt: 'desc' },
      });
      
      console.log(`📋 Trovati ${profiles.length} profili escort nel database`)
      
      mapped = profiles.map((p) => {
        const cities = Array.isArray(p.cities) ? (p.cities as any[]) : [];
        const isGirl = p.girlOfTheDayDate ? p.girlOfTheDayDate.toISOString().slice(0,10) === todayStr : false;
        const prio = tierPriority(p.tier as any, isGirl);
        const slug = p.user?.slug || `${kebab(p.user?.nome || '')}-${p.user?.id}`;
        return {
          id: p.userId,
          name: p.user?.nome || `User ${p.userId}`,
          slug,
          cities,
          tier: p.tier,
          girlOfTheDay: isGirl,
          priority: prio,
          updatedAt: p.updatedAt,
          contacts: (p as any).contacts || null,
          isVerified: Boolean((p as any)?.verified),
          onTour: Boolean((p as any)?.onTour),
          bio: (p as any)?.bio || null,
        };
      }).filter(x => (!city || x.cities.length === 0 || x.cities.some((c:any)=> String(c).toLowerCase().includes(city))) && (!query || String(x.name).toLowerCase().includes(query) || (Array.isArray(x.cities) && x.cities.some((c:any)=> String(c).toLowerCase().includes(query)))));
    }

    // Sort by priority desc then updatedAt desc
    mapped.sort((a,b) => (b.priority - a.priority) || (new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));

    const total = mapped.length;
    const start = (pageNum-1) * pageSize;
    const end = start + pageSize;
    const pageItems = mapped.slice(start, end);

    // Attach cover photo (latest APPROVED) for each user
    const itemsWithCovers = await Promise.all(pageItems.map(async (it) => {
      try {
        const ph = await prisma.photo.findFirst({ where: { userId: it.id, status: 'APPROVED' }, orderBy: { updatedAt: 'desc' } });
        return { ...it, coverUrl: ph?.url || null };
      } catch {
        return { ...it, coverUrl: null };
      }
    }));

    console.log(`✅ Restituiti ${itemsWithCovers.length} annunci (${total} totali)`)
    return res.status(200).json({ total, page: pageNum, pageSize, items: itemsWithCovers });
  } catch (error: unknown) {
    console.error('❌ ERRORE in /api/public/annunci:', error)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
