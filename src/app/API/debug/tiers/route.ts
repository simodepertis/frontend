import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Prendi tutti i profili con tier non-standard
    const profiles = await prisma.escortProfile.findMany({
      where: {
        tier: { not: 'STANDARD' }
      },
      include: {
        user: { select: { id: true, nome: true, slug: true } }
      },
      orderBy: { updatedAt: 'desc' }
    })

    const result = profiles.map(p => ({
      userId: p.userId,
      nome: p.user?.nome,
      tier: p.tier,
      tierExpiresAt: p.tierExpiresAt,
      girlOfTheDayDate: p.girlOfTheDayDate,
    }))

    return NextResponse.json({
      message: 'Debug tier data',
      count: result.length,
      profiles: result
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Failed to fetch tier data',
      details: error.message 
    }, { status: 500 })
  }
}
