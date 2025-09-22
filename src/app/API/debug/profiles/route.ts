import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEBUG: Checking all users...');
    
    // Get ALL users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        ruolo: true,
        createdAt: true
      }
    });
    
    console.log('🔍 DEBUG: Total users:', allUsers.length);
    console.log('🔍 DEBUG: Users by role:', allUsers.reduce((acc, u) => {
      acc[u.ruolo] = (acc[u.ruolo] || 0) + 1;
      return acc;
    }, {} as any));
    
    // Get ALL escort profiles
    const allEscortProfiles = await prisma.escortProfile.findMany({
      select: {
        id: true,
        userId: true,
        consentAcceptedAt: true,
        updatedAt: true
      }
    });
    
    console.log('🔍 DEBUG: Total escort profiles:', allEscortProfiles.length);
    console.log('🔍 DEBUG: Profiles with consent:', allEscortProfiles.filter(p => p.consentAcceptedAt).length);
    
    // Get escort users with profiles
    const escortUsers = await prisma.user.findMany({
      where: { ruolo: 'escort' },
      include: {
        escortProfile: true
      }
    });
    
    console.log('🔍 DEBUG: Escort users:', escortUsers.length);
    
    const debugData = {
      totalUsers: allUsers.length,
      usersByRole: allUsers.reduce((acc, u) => {
        acc[u.ruolo] = (acc[u.ruolo] || 0) + 1;
        return acc;
      }, {} as any),
      totalEscortProfiles: allEscortProfiles.length,
      profilesWithConsent: allEscortProfiles.filter(p => p.consentAcceptedAt).length,
      escortUsers: escortUsers.map(u => ({
        id: u.id,
        nome: u.nome,
        email: u.email,
        hasProfile: !!u.escortProfile,
        hasConsent: !!u.escortProfile?.consentAcceptedAt,
        consentDate: u.escortProfile?.consentAcceptedAt,
        updatedAt: u.escortProfile?.updatedAt
      }))
    };
    
    return NextResponse.json(debugData);
  } catch (error) {
    console.error('❌ DEBUG Error:', error);
    return NextResponse.json({ error: 'Debug error', details: error }, { status: 500 });
  }
}
