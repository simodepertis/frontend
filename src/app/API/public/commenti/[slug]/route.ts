import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const user = await prisma.user.findFirst({ where: { slug }, select: { id: true } });
    if (!user) return NextResponse.json({ items: [] });
    const comments = await prisma.comment.findMany({
      where: { targetUserId: user.id, status: 'APPROVED' as any },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { id: true, body: true, createdAt: true, author: { select: { id: true, nome: true } } }
    });
    return NextResponse.json({ items: comments });
  } catch {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
