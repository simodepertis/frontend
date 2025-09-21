import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    // Find user by slug or by name guess
    const user = await prisma.user.findFirst({ where: { slug } , select: { id: true } });
    if (!user) return NextResponse.json({ items: [] });
    const reviews = await prisma.review.findMany({
      where: { targetUserId: user.id, status: 'APPROVED' as any },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, rating: true, title: true, body: true, createdAt: true, author: { select: { id: true, nome: true } } }
    });
    return NextResponse.json({ items: reviews });
  } catch {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
