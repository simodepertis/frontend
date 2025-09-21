import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const raw = getTokenFromRequest(request);
    if (!raw) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    const payload = verifyToken(raw);
    if (!payload) return NextResponse.json({ error: "Token non valido" }, { status: 401 });

    // Leggi profilo; se non esiste, restituisci vuoto (client lo tratterà come bozza)
    const prof = await prisma.escortProfile.findUnique({ where: { userId: payload.userId } });
    return NextResponse.json({ profile: prof || null });
  } catch (e) {
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const raw = getTokenFromRequest(request);
    if (!raw) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    const payload = verifyToken(raw);
    if (!payload) return NextResponse.json({ error: "Token non valido" }, { status: 401 });

    const body = await request.json();
    // Accettiamo direttamente i campi del wizard; salviamo come JSON i blocchi
    const { bioIt, bioEn, languages, cities, services, rates, contacts } = body || {};

    const updated = await prisma.escortProfile.upsert({
      where: { userId: payload.userId },
      update: {
        bioIt: typeof bioIt === 'string' ? bioIt : undefined,
        bioEn: typeof bioEn === 'string' ? bioEn : undefined,
        languages: languages ?? undefined,
        cities: cities ?? undefined,
        services: services ?? undefined,
        rates: rates ?? undefined,
        contacts: contacts ?? undefined,
      },
      create: {
        userId: payload.userId,
        bioIt: typeof bioIt === 'string' ? bioIt : null,
        bioEn: typeof bioEn === 'string' ? bioEn : null,
        languages: languages ?? null,
        cities: cities ?? null,
        services: services ?? null,
        rates: rates ?? null,
        contacts: contacts ?? null,
      }
    });

    return NextResponse.json({ profile: updated });
  } catch (e) {
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
