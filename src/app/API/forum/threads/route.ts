import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get('limit') || 20), 100);
    const category = url.searchParams.get('category') || undefined;

    const where = category ? { category } : {};
    const items = await prisma.forumThread.findMany({
      where: where as any,
      orderBy: { createdAt: 'desc' },
      take: isNaN(limit) ? 20 : limit,
      select: {
        id: true,
        title: true,
        body: true,
        category: true,
        createdAt: true,
        author: { select: { id: true, nome: true } },
        _count: { select: { posts: true } }
      }
    });
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const raw = getTokenFromRequest(request) || '';
    const payload = verifyToken(raw);
    if (!payload) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    const body = await request.json();
    const title = String(body?.title || '').trim().slice(0, 200);
    const text = String(body?.body || '').trim().slice(0, 5000);
    const category = String(body?.category || 'generale').slice(0, 30);
    if (!title || !text) return NextResponse.json({ error: 'Titolo e testo obbligatori' }, { status: 400 });

    const created = await prisma.forumThread.create({
      data: {
        authorId: payload.userId,
        title,
        body: text,
        category,
      },
      select: { id: true }
    });
    return NextResponse.json({ ok: true, id: created.id });
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
