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

    console.log('🔍 DEBUG Consent - User:', u.id, u.email, u.ruolo);

    // Ensure escort profile exists
    const profile = await prisma.escortProfile.upsert({
      where: { userId: u.id },
      update: {},
      create: { userId: u.id },
    });

    console.log('🔍 DEBUG Consent - Profile created/found:', profile.id);

    const updatedProfile = await prisma.escortProfile.update({
      where: { userId: u.id },
      data: ({ consentAcceptedAt: new Date() } as any),
    });

    console.log('🔍 DEBUG Consent - Profile updated with consent:', updatedProfile.consentAcceptedAt);
    return NextResponse.json({ ok: true, profile: updatedProfile });
  } catch (e) {
    console.error('❌ DEBUG Consent - Error:', e);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
