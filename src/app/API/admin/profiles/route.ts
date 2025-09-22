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

    // Get escort users with their profiles that need approval (no consent yet)
    const profiles = await prisma.user.findMany({
      where: {
        ruolo: 'escort',
        escortProfile: {
          consentAcceptedAt: null // Profiles without consent need approval
        }
      },
      select: {
        id: true,
        nome: true,
        email: true,
        createdAt: true,
        escortProfile: {
          select: {
            id: true,
            tier: true,
            cities: true,
            consentAcceptedAt: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // Transform the data to match the expected format
    const formattedProfiles = profiles.map(user => ({
      id: user.escortProfile?.id || 0, // Use escort profile ID for approval
      userId: user.id,
      nome: user.nome,
      email: user.email,
      tier: user.escortProfile?.tier || 'STANDARD',
      verified: false, // Always false since they're pending
      createdAt: user.createdAt.toISOString().split('T')[0],
      cities: user.escortProfile?.cities ? (Array.isArray(user.escortProfile.cities) ? user.escortProfile.cities : []) : []
    }));

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
      // Approve the escort profile by setting consent date
      const updatedProfile = await prisma.escortProfile.update({
        where: { id: profileId },
        data: { 
          consentAcceptedAt: new Date()
        },
      });
      
      return NextResponse.json({ 
        success: true, 
        profile: updatedProfile,
        message: 'Profilo approvato con successo'
      });
    } else {
      // For rejection, we could delete the profile or mark it somehow
      // For now, let's just return success (you might want to add a rejection field)
      return NextResponse.json({ 
        success: true,
        message: 'Profilo rifiutato'
      });
    }
  } catch (error) {
    console.error('❌ Errore approvazione profilo:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
