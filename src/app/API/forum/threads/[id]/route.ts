import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const threadId = Number(id);
    if (!Number.isFinite(threadId)) return NextResponse.json({ error: 'ID non valido' }, { status: 400 });
    const t = await prisma.forumThread.findUnique({
      where: { id: threadId },
      select: {
        id: true,
        title: true,
        body: true,
        category: true,
        createdAt: true,
        author: { select: { id: true, nome: true } },
        posts: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, body: true, createdAt: true, author: { select: { id: true, nome: true } } }
        }
      }
    });
    if (!t) return NextResponse.json({ error: 'Discussione non trovata' }, { status: 404 });
    return NextResponse.json({ item: t });
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
