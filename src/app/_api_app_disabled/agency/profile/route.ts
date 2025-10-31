import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const raw = getTokenFromRequest(request);
    if (!raw) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    const payload = verifyToken(raw);
    if (!payload) return NextResponse.json({ error: "Token non valido" }, { status: 401 });

    const prof = await prisma.agencyProfile.findUnique({ where: { userId: payload.userId } });
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
    const { name, description, languages, cities, services, contacts, website, socials } = body || {};

    const updated = await prisma.agencyProfile.upsert({
      where: { userId: payload.userId },
      update: {
        name: typeof name === 'string' ? name : undefined,
        description: typeof description === 'string' ? description : undefined,
        languages: languages ?? undefined,
        cities: cities ?? undefined,
        services: services ?? undefined,
        contacts: contacts ?? undefined,
        website: typeof website === 'string' ? website : undefined,
        socials: socials ?? undefined,
      },
      create: {
        userId: payload.userId,
        name: typeof name === 'string' ? name : null,
        description: typeof description === 'string' ? description : null,
        languages: languages ?? null,
        cities: cities ?? null,
        services: services ?? null,
        contacts: contacts ?? null,
        website: typeof website === 'string' ? website : null,
        socials: socials ?? null,
      }
    });

    return NextResponse.json({ profile: updated });
  } catch (e) {
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
