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

    // SIMPLIFIED: Get ALL escort users with their profiles
    const profiles = await prisma.user.findMany({
      where: {
        ruolo: 'escort'
      },
      include: {
        escortProfile: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // Transform the data to match the expected format
    console.log('🔍 DEBUG Admin Profiles - Raw profiles found:', profiles.length);
    console.log('🔍 DEBUG Admin Profiles - First profile:', profiles[0]);

    const formattedProfiles = profiles
      .filter(user => user.escortProfile) // Only users with escort profiles
      .map(user => ({
        id: user.escortProfile!.id, // Use escort profile ID for approval
        userId: user.id,
        nome: user.nome,
        email: user.email,
        tier: user.escortProfile!.tier || 'STANDARD',
        verified: !!user.escortProfile!.consentAcceptedAt, // True if has consent
        createdAt: user.createdAt.toISOString().split('T')[0],
        cities: user.escortProfile!.cities ? (Array.isArray(user.escortProfile!.cities) ? user.escortProfile!.cities : []) : []
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
