import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

async function requireAdmin(request: NextRequest) {
  const raw = getTokenFromRequest(request);
  if (!raw) return null;
  const payload = verifyToken(raw);
  if (!payload) return null;
  const u = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!u) return null;
  // Check if user is admin by role only
  if (u.ruolo === 'admin') return payload;
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const adm = await requireAdmin(request);
    if (!adm) return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });

    // Get ALL escort users with their profiles (create profile if missing)
    const escortUsers = await prisma.user.findMany({
      where: {
        ruolo: 'escort'
      },
      select: {
        id: true,
        nome: true,
        email: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // For each escort user, ensure they have a profile and get profile data
    const profiles = await Promise.all(
      escortUsers.map(async (user) => {
        // Ensure escort profile exists
        const profile = await prisma.escortProfile.upsert({
          where: { userId: user.id },
          update: {},
          create: { userId: user.id },
        });

        return {
          user,
          escortProfile: profile
        };
      })
    );

    // Transform the data to match the expected format
    console.log('🔍 DEBUG Admin Profiles - Raw profiles found:', profiles.length);
    console.log('🔍 DEBUG Admin Profiles - First profile:', profiles[0]);

    const formattedProfiles = profiles.map(item => ({
      id: item.escortProfile.id, // Use escort profile ID for approval
      userId: item.user.id,
      nome: item.user.nome,
      email: item.user.email,
      tier: item.escortProfile.tier || 'STANDARD',
      verified: !!item.escortProfile.consentAcceptedAt, // True if has consent
      createdAt: item.user.createdAt.toISOString().split('T')[0],
      cities: item.escortProfile.cities ? (Array.isArray(item.escortProfile.cities) ? item.escortProfile.cities : []) : []
    }));

    console.log('🔍 DEBUG Admin Profiles - Formatted profiles:', formattedProfiles.length);
    return NextResponse.json({ profiles: formattedProfiles });
  } catch (error) {
    console.error('❌ Errore caricamento profili:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adm = await requireAdmin(request);
    if (!adm) return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    
    const body = await request.json();
    const { profileId, action } = body;
    
    if (!profileId || !action) {
      return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 });
    }
    
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });
    }
    
    if (action === 'approve') {
      // Approve the escort profile - we'll update the updatedAt to mark as processed
      const updatedProfile = await prisma.escortProfile.update({
        where: { id: profileId },
        data: { 
          // Keep consent but update timestamp to mark as processed
          updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Set to 7 days ago so it doesn't appear in pending list
        },
      });
      
      return NextResponse.json({ 
        success: true, 
        profile: updatedProfile,
        message: 'Profilo approvato con successo'
      });
    } else {
      // For rejection, remove consent so profile becomes inactive
      const updatedProfile = await prisma.escortProfile.update({
        where: { id: profileId },
        data: { 
          consentAcceptedAt: null // Remove consent to deactivate profile
        },
      });
      
      return NextResponse.json({ 
        success: true,
        profile: updatedProfile,
        message: 'Profilo rifiutato'
      });
    }
  } catch (error) {
    console.error('❌ Errore approvazione profilo:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
