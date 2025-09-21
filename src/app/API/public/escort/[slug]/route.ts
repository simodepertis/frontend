import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function titleCase(s: string) {
  return s.split(/\s+/).filter(Boolean).map(w => w[0]?.toUpperCase() + w.slice(1)).join(' ');
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    if (!slug) return NextResponse.json({ error: 'Slug mancante' }, { status: 400 });
    const guessName = titleCase(slug.replace(/-/g, ' ').trim());
    // If slug ends with -<id>, try lookup by user id directly (more robust)
    const idMatch = slug.match(/-(\d+)$/);
    const userIdFromSlug = idMatch ? Number(idMatch[1]) : null;
    const user = userIdFromSlug
      ? await prisma.user.findUnique({
          where: { id: userIdFromSlug },
          include: {
            escortProfile: {
              select: {
                tier: true,
                tierExpiresAt: true,
                cities: true,
                girlOfTheDayDate: true,
                updatedAt: true,
                services: true,
                rates: true,
                contacts: true,
                languages: true,
                bioIt: true,
                bioEn: true,
              }
            },
            bookingSettings: true,
          }
        })
      : await prisma.user.findFirst({
          where: { OR: [ { slug: slug }, { nome: guessName } ] },
          include: {
            escortProfile: {
              select: {
                tier: true,
                tierExpiresAt: true,
                cities: true,
                girlOfTheDayDate: true,
                updatedAt: true,
                services: true,
                rates: true,
                contacts: true,
                languages: true,
                bioIt: true,
                bioEn: true,
              }
            },
            bookingSettings: true,
          }
        });

    if (!user) return NextResponse.json({ error: 'Profilo non trovato' }, { status: 404 });

    let photos = await prisma.photo.findMany({ where: { userId: user.id, status: 'APPROVED' as any }, orderBy: { updatedAt: 'desc' }, take: 24 });
    if (photos.length === 0 && process.env.NODE_ENV !== 'production') {
      // In sviluppo, se non ci sono APPROVED, mostra anche bozze/in review per facilitare i test
      photos = await prisma.photo.findMany({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' }, take: 24 });
    }
    const coverUrl = photos[0]?.url || null;
    const p = user.escortProfile as any;
    return NextResponse.json({
      userId: user.id,
      nome: user.nome,
      slug: user.slug,
      cities: p?.cities ?? [],
      tier: p?.tier ?? 'STANDARD',
      tierExpiresAt: p?.tierExpiresAt ?? null,
      girlOfTheDay: p?.girlOfTheDayDate ? (new Date(p.girlOfTheDayDate).toISOString().slice(0,10) === new Date().toISOString().slice(0,10)) : false,
      updatedAt: p?.updatedAt ?? null,
      services: p?.services ?? [],
      rates: p?.rates ?? [],
      contacts: p?.contacts ?? {},
      languages: p?.languages ?? [],
      bio: p?.bioIt ?? p?.bioEn ?? null,
      photos: photos.map(ph => ph.url),
      booking: user.bookingSettings ? {
        enabled: user.bookingSettings.enabled,
        minNotice: user.bookingSettings.minNotice,
        allowedDurations: user.bookingSettings.allowedDurations,
        prices: user.bookingSettings.prices,
        schedule: user.bookingSettings.schedule,
      } : null,
      coverUrl,
    });
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
