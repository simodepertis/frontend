import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const raw = getTokenFromRequest(request);
    const payload = verifyToken(raw || "");
    if (!payload) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const url = new URL(request.url);
    const type = String(url.searchParams.get('type') || 'received'); // 'received' | 'written'

    if (type === 'written') {
      const items = await prisma.review.findMany({
        where: { authorId: payload.userId },
        orderBy: { createdAt: 'desc' },
        take: 200,
        select: {
          id: true, rating: true, title: true, body: true, createdAt: true,
          target: { select: { id: true, nome: true, slug: true } }
        }
      });
      return NextResponse.json({ items });
    } else {
      const items = await prisma.review.findMany({
        where: { targetUserId: payload.userId },
        orderBy: { createdAt: 'desc' },
        take: 200,
        select: {
          id: true, rating: true, title: true, body: true, createdAt: true,
          author: { select: { id: true, nome: true } }
        }
      });
      return NextResponse.json({ items });
    }
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
