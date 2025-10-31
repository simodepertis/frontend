import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizeUrl(u: string | null | undefined): string {
  const s = String(u || '');
  if (s.startsWith('/uploads/')) return '/api' + s; // serve tramite API proxy
  try {
    const url = new URL(s);
    if (url.pathname.startsWith('/uploads/')) return '/api' + url.pathname;
  } catch {}
  return s;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = (searchParams.get('citta') || '').trim().toLowerCase();
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const pageSize = Math.min(48, Math.max(1, Number(searchParams.get('pageSize') || 24)));

    // Trova foto APPROVATE più recenti
    const photos = await prisma.photo.findMany({
      where: { status: 'APPROVED' },
      orderBy: { updatedAt: 'desc' },
      take: 500, // limite ragionevole per filtro lato server
      include: {
        user: { select: { id: true, nome: true, slug: true, escortProfile: { select: { cities: true } } } }
      }
    });

    const mapped = photos.map((p) => {
      const cities = Array.isArray((p.user as any)?.escortProfile?.cities) ? ((p.user as any).escortProfile.cities as any[]) : [];
      const inCity = !city || cities.some((c:any) => String(c).toLowerCase().includes(city));
      return {
        id: p.id,
        url: normalizeUrl(p.url),
        userId: p.userId,
        userName: (p.user as any)?.nome || `User ${p.userId}`,
        slug: (p.user as any)?.slug || null,
        cities,
        verified: p.status === 'APPROVED',
        updatedAt: p.updatedAt,
      };
    }).filter(x => !city || x.cities.length === 0 || x.cities.some((c:any)=> String(c).toLowerCase().includes(city)));

    const total = mapped.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = mapped.slice(start, end);

    return NextResponse.json({ total, page, pageSize, items });
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
