import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const raw = getTokenFromRequest(request);
    if (!raw) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    const payload = verifyToken(raw);
    if (!payload) return NextResponse.json({ error: "Token non valido" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('query') || '').trim();
    const lang = (searchParams.get('lang') || '').trim().toLowerCase();
    const city = (searchParams.get('city') || '').trim().toLowerCase();
    const service = (searchParams.get('service') || '').trim().toLowerCase();
    if (q.length < 2) return NextResponse.json({ results: [] });

    // 1) Trova utenti escort per nome/email (senza 'mode' per compatibilità)
    const users = await prisma.user.findMany({
      where: {
        ruolo: 'escort',
        OR: [
          { nome: { contains: q } },
          { email: { contains: q } },
        ],
      },
      select: { id: true, nome: true, email: true },
      take: 10,
    });

    if (users.length === 0) return NextResponse.json({ results: [] });

    // 2) Recupera i rispettivi escortProfile per leggere agencyId
    const profiles = await prisma.escortProfile.findMany({
      where: { userId: { in: users.map(u => u.id) } },
      select: { userId: true, agencyId: true, languages: true, cities: true, services: true },
    });
    const byUserId = new Map<number, any>();
    profiles.forEach(p => byUserId.set(p.userId, p));

    let results = users.map(u => {
      const prof = byUserId.get(u.id);
      return {
        id: u.id,
        nome: u.nome,
        email: u.email,
        escortProfile: {
          agencyId: prof?.agencyId ?? null,
          languages: prof?.languages ?? [],
          cities: prof?.cities ?? [],
          services: prof?.services ?? { general: [], extra: [], fetish: [], virtual: [] },
        },
      };
    });

    // Server-side filtering on JSON content
    const any = (v?: any) => Array.isArray(v) ? v : [];
    results = results.filter((r: any) => {
      const langs: string[] = any(r.escortProfile.languages).map((x: any) => String(x).toLowerCase());
      const cities: string[] = any(r.escortProfile.cities).map((x: any) => String(x).toLowerCase());
      const srvObj = r.escortProfile.services || { general: [], extra: [], fetish: [], virtual: [] };
      const allServices: string[] = [...any(srvObj.general), ...any(srvObj.extra), ...any(srvObj.fetish), ...any(srvObj.virtual)].map((x: any) => String(x).toLowerCase());
      const langOk = !lang || langs.join(' ').includes(lang);
      const cityOk = !city || cities.join(' ').includes(city);
      const serviceOk = !service || allServices.join(' ').includes(service);
      return langOk && cityOk && serviceOk;
    });

    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
