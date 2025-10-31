import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEBUG: Starting admin profiles debug...');
    
    // 1. Check all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        ruolo: true,
        createdAt: true
      }
    });
    
    console.log('🔍 DEBUG: Total users found:', allUsers.length);
    console.log('🔍 DEBUG: Users by role:', allUsers.reduce((acc, u) => {
      acc[u.ruolo] = (acc[u.ruolo] || 0) + 1;
      return acc;
    }, {} as any));
    
    // 2. Check escort users specifically
    const escortUsers = await prisma.user.findMany({
      where: { ruolo: 'escort' },
      select: {
        id: true,
        nome: true,
        email: true,
        createdAt: true
      }
    });
    
    console.log('🔍 DEBUG: Escort users found:', escortUsers.length);
    
    // 3. Check escort profiles
    const escortProfiles = await prisma.escortProfile.findMany({
      select: {
        id: true,
        userId: true,
        consentAcceptedAt: true,
        updatedAt: true
      }
    });
    
    console.log('🔍 DEBUG: Escort profiles found:', escortProfiles.length);
    console.log('🔍 DEBUG: Profiles with consent:', escortProfiles.filter(p => p.consentAcceptedAt).length);
    
    // 4. Try the actual admin query
    const adminQuery = await prisma.user.findMany({
      where: {
        ruolo: 'escort'
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
    
    console.log('🔍 DEBUG: Admin query result:', adminQuery.length);
    
    const debugData = {
      totalUsers: allUsers.length,
      usersByRole: allUsers.reduce((acc, u) => {
        acc[u.ruolo] = (acc[u.ruolo] || 0) + 1;
        return acc;
      }, {} as any),
      escortUsers: escortUsers.length,
      escortProfiles: escortProfiles.length,
      profilesWithConsent: escortProfiles.filter(p => p.consentAcceptedAt).length,
      adminQueryResult: adminQuery.length,
      sampleEscortUsers: escortUsers.slice(0, 3),
      sampleEscortProfiles: escortProfiles.slice(0, 3),
      adminQuerySample: adminQuery.slice(0, 3)
    };
    
    return NextResponse.json(debugData);
  } catch (error) {
    console.error('❌ DEBUG Error:', error);
    return NextResponse.json({ error: 'Debug error', details: error }, { status: 500 });
  }
}
