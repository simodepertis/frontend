import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  try {
    const items = await prisma.review.findMany({
      where: { status: 'APPROVED' as any },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        rating: true,
        title: true,
        body: true,
        createdAt: true,
        author: { select: { id: true, nome: true } },
        target: { select: { id: true, nome: true, slug: true } },
      }
    });
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
