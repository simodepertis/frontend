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

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 DEBUG: Test publish workflow...');
    
    const u = await requireAuth(request);
    if (!u) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    console.log('🧪 DEBUG: User authenticated:', u.id, u.email, u.ruolo);

    // 1. Check if user has escort profile
    let escortProfile = await prisma.escortProfile.findUnique({
      where: { userId: u.id }
    });

    console.log('🧪 DEBUG: Existing escort profile:', escortProfile?.id || 'NONE');

    // 2. Create escort profile if missing
    if (!escortProfile) {
      console.log('🧪 DEBUG: Creating escort profile...');
      escortProfile = await prisma.escortProfile.create({
        data: { userId: u.id }
      });
      console.log('🧪 DEBUG: Created escort profile:', escortProfile.id);
    }

    // 3. Set consent
    console.log('🧪 DEBUG: Setting consent...');
    const updatedProfile = await prisma.escortProfile.update({
      where: { userId: u.id },
      data: { consentAcceptedAt: new Date() }
    });

    console.log('🧪 DEBUG: Consent set:', updatedProfile.consentAcceptedAt);

    // 4. Check what admin API would return
    const adminQuery = await prisma.user.findMany({
      where: {
        ruolo: 'escort'
      },
      include: {
        escortProfile: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const profilesWithEscortProfile = adminQuery.filter(user => user.escortProfile);
    
    console.log('🧪 DEBUG: Admin query would return:', profilesWithEscortProfile.length, 'profiles');

    return NextResponse.json({
      success: true,
      user: { id: u.id, email: u.email, ruolo: u.ruolo },
      escortProfile: updatedProfile,
      adminWouldSee: profilesWithEscortProfile.length,
      adminProfiles: profilesWithEscortProfile.map(user => ({
        userId: user.id,
        nome: user.nome,
        email: user.email,
        hasConsent: !!user.escortProfile?.consentAcceptedAt,
        consentDate: user.escortProfile?.consentAcceptedAt
      }))
    });
  } catch (error) {
    console.error('❌ DEBUG Test publish error:', error);
    return NextResponse.json({ error: 'Debug error', details: error }, { status: 500 });
  }
}
