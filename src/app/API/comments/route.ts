import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const raw = getTokenFromRequest(request);
    const payload = verifyToken(raw || "");
    if (!payload) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    const body = await request.json();
    const targetUserId = Number(body?.targetUserId);
    const text = String(body?.body || '').slice(0,2000);
    if (!targetUserId || !text) {
      return NextResponse.json({ error: 'Parametri non validi' }, { status: 400 });
    }
    const status = process.env.NODE_ENV !== 'production' ? 'APPROVED' : 'IN_REVIEW';
    const created = await prisma.comment.create({ data: {
      authorId: payload.userId,
      targetUserId,
      body: text,
      status: status as any,
    }});
    return NextResponse.json({ ok: true, comment: { id: created.id, status: created.status } });
  } catch {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
