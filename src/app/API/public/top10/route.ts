import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    // Aggregate profile events in last 30 days
    const events = await prisma.profileEvent.findMany({
      where: { createdAt: { gte: since } },
      select: { userId: true, type: true },
    });

    const scoreByUser: Record<number, number> = {};
    for (const e of events) {
      const weight = e.type === 'VIEW' ? 1 : e.type === 'CONTACT_CLICK' ? 5 : e.type === 'SAVE' ? 3 : 0;
      scoreByUser[e.userId] = (scoreByUser[e.userId] || 0) + weight;
    }

    const userIds = Object.keys(scoreByUser).map(Number);
    if (userIds.length === 0) return NextResponse.json({ items: [] });

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, nome: true, slug: true, escortProfile: { select: { cities: true, tier: true } } },
    });

    // Attach cover photo
    const items = await Promise.all(users.map(async (u) => {
      const ph = await prisma.photo.findFirst({ where: { userId: u.id, status: 'APPROVED' }, orderBy: { updatedAt: 'desc' } });
      return {
        userId: u.id,
        name: u.nome,
        slug: u.slug,
        cities: (u.escortProfile?.cities as any[]) || [],
        tier: u.escortProfile?.tier || 'STANDARD',
        coverUrl: ph?.url || null,
        score: scoreByUser[u.id] || 0,
      };
    }));

    items.sort((a,b) => b.score - a.score);
    const top = items.slice(0, 10).map((x, idx) => ({ ...x, rank: idx + 1 }));

    return NextResponse.json({ items: top });
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
