import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const raw = getTokenFromRequest(request);
    if (!raw) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    const payload = verifyToken(raw);
    if (!payload) return NextResponse.json({ error: "Token non valido" }, { status: 401 });

    const s = await prisma.bookingSettings.findUnique({ where: { userId: payload.userId } });
    return NextResponse.json({ settings: s || null });
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
    const { enabled, minNotice, allowedDurations, prices, schedule } = body || {};

    const updated = await prisma.bookingSettings.upsert({
      where: { userId: payload.userId },
      update: {
        enabled: typeof enabled === 'boolean' ? enabled : undefined,
        minNotice: typeof minNotice === 'string' ? minNotice : undefined,
        allowedDurations: allowedDurations ?? undefined,
        prices: prices ?? undefined,
        schedule: schedule ?? undefined,
      },
      create: {
        userId: payload.userId,
        enabled: !!enabled,
        minNotice: typeof minNotice === 'string' ? minNotice : '1 ora',
        allowedDurations: allowedDurations ?? ["1 ora", "2 ore"],
        prices: prices ?? { "1 ora": 160 },
        schedule: schedule ?? {},
      }
    });

    return NextResponse.json({ settings: updated });
  } catch (e) {
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
