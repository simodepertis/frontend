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
    console.log('🔍 DEBUG Consent PATCH - Starting...');
    
    const u = await requireAuth(request);
    if (!u) {
      console.log('❌ DEBUG Consent - Not authenticated');
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    console.log('🔍 DEBUG Consent - User authenticated:', u.id, u.email, u.ruolo);

    // Check if user is escort
    if (u.ruolo !== 'escort') {
      console.log('❌ DEBUG Consent - User is not escort:', u.ruolo);
      return NextResponse.json({ error: 'Solo gli escort possono accettare il consenso' }, { status: 403 });
    }

    // Ensure escort profile exists
    console.log('🔍 DEBUG Consent - Creating/finding profile...');
    const profile = await prisma.escortProfile.upsert({
      where: { userId: u.id },
      update: {},
      create: { userId: u.id },
    });

    console.log('🔍 DEBUG Consent - Profile found/created:', profile.id);

    // Update with consent
    console.log('🔍 DEBUG Consent - Updating with consent...');
    const now = new Date();
    const updatedProfile = await prisma.escortProfile.update({
      where: { userId: u.id },
      data: { consentAcceptedAt: now },
    });

    console.log('🔍 DEBUG Consent - SUCCESS! Consent set:', updatedProfile.consentAcceptedAt);
    
    return NextResponse.json({ 
      ok: true, 
      message: 'Consenso registrato con successo',
      consentAcceptedAt: updatedProfile.consentAcceptedAt?.toISOString()
    });
  } catch (e) {
    console.error('❌ DEBUG Consent - CRITICAL ERROR:', e);
    return NextResponse.json({ 
      error: 'Errore interno del server', 
      details: e instanceof Error ? e.message : 'Unknown error'
    }, { status: 500 });
  }
}
