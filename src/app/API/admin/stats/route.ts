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

    // Get real statistics from database
    const [
      totalUsers,
      pendingPhotos,
      pendingVideos,
      pendingOrders,
      pendingProfiles,
      totalCreditsOrdered
    ] = await Promise.all([
      // Total users count
      prisma.user.count(),
      
      // Pending photos count
      prisma.photo.count({
        where: { status: 'IN_REVIEW' }
      }),
      
      // Pending videos count  
      prisma.video.count({
        where: { status: 'IN_REVIEW' }
      }),
      
      // Pending credit orders count
      prisma.creditOrder.count({
        where: { status: 'PENDING' }
      }),
      
      // Pending profiles count (escort profiles with consent but updated recently)
      (async () => {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        
        return prisma.user.count({
          where: {
            ruolo: 'escort',
            escortProfile: {
              consentAcceptedAt: { not: null },
              updatedAt: { gte: twoDaysAgo }
            }
          }
        });
      })(),
      
      // Total credits ordered (sum of all credit orders)
      prisma.creditOrder.aggregate({
        _sum: {
          credits: true
        },
        where: {
          status: 'PAID'
        }
      }).then(result => result._sum.credits || 0)
    ]);

    const stats = {
      totalUsers,
      pendingPhotos,
      pendingVideos,
      pendingOrders,
      pendingProfiles,
      totalCreditsOrdered
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('❌ Errore caricamento statistiche admin:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
