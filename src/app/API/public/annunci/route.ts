import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = (searchParams.get('citta') || '').trim().toLowerCase();
    const type = (searchParams.get('type') || '').trim().toUpperCase(); // VIRTUAL|PHYSICAL
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const pageSize = 40;

    let mapped: any[] = [];
    const todayStr = new Date().toISOString().slice(0,10);

    if (type === 'VIRTUAL') {
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
      }).filter((x: any) => (!city || x.cities.some((c: string)=> String(c).toLowerCase().includes(city))) && (!q || String(x.name).toLowerCase().includes(q) || x.cities.some((c: string)=> String(c).toLowerCase().includes(q))));
    } else {
      // Profili escort (annunci fisici)
      const profiles = await prisma.escortProfile.findMany({
        include: { user: { select: { id: true, nome: true, slug: true } } },
        orderBy: { updatedAt: 'desc' },
      });
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
      }).filter(x => (!city || x.cities.length === 0 || x.cities.some((c:any)=> String(c).toLowerCase().includes(city))) && (!q || String(x.name).toLowerCase().includes(q) || (Array.isArray(x.cities) && x.cities.some((c:any)=> String(c).toLowerCase().includes(q)))));
    }

    // Sort by priority desc then updatedAt desc
    mapped.sort((a,b) => (b.priority - a.priority) || (new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));

    const total = mapped.length;
    const start = (page-1) * pageSize;
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

    return NextResponse.json({ total, page, pageSize, items: itemsWithCovers });
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
