import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const raw = getTokenFromRequest(request) || '';
    const payload = verifyToken(raw);
    if (!payload) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    const body = await request.json();
    const threadId = Number(body?.threadId || 0);
    const text = String(body?.body || '').trim().slice(0, 5000);
    if (!threadId || !text) return NextResponse.json({ error: 'Parametri non validi' }, { status: 400 });

    const thread = await prisma.forumThread.findUnique({ where: { id: threadId }, select: { id: true } });
    if (!thread) return NextResponse.json({ error: 'Discussione non trovata' }, { status: 404 });

    const created = await prisma.forumPost.create({
      data: { threadId, authorId: payload.userId, body: text },
      select: { id: true, createdAt: true }
    });

    return NextResponse.json({ ok: true, id: created.id });
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
