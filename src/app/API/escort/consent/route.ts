import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

async function requireAuth(request: NextRequest) {
  const raw = getTokenFromRequest(request);
  if (!raw) return null;
  const payload = verifyToken(raw);
  if (!payload) return null;
  const u = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!u) return null;
  return u;
}

export async function GET(request: NextRequest) {
  try {
    const u = await requireAuth(request);
    if (!u) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    const escort: any = await prisma.escortProfile.findUnique({ where: { userId: u.id } });
    return NextResponse.json({ consentAcceptedAt: escort?.consentAcceptedAt ?? null });
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const u = await requireAuth(request);
    if (!u) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    // Ensure escort profile exists
    await prisma.escortProfile.upsert({
      where: { userId: u.id },
      update: {},
      create: { userId: u.id },
    });

    await prisma.escortProfile.update({
      where: { userId: u.id },
      data: ({ consentAcceptedAt: new Date() } as any),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
