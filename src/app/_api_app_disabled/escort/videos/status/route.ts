import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

async function requireAuth(request: NextRequest) {
  const raw = getTokenFromRequest(request);
  if (!raw) return null;
  const payload = verifyToken(raw);
  if (!payload) return null;
  const u = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!u) return null;
  return { userId: u.id };
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    const body = await request.json();
    const id = Number(body?.id || 0);
    const action = String(body?.action || '').toLowerCase();
    if (!id || !['draft','in_review'].includes(action)) return NextResponse.json({ error: 'Parametri non validi' }, { status: 400 });
    const v = await prisma.video.findUnique({ where: { id } });
    if (!v || v.userId !== auth.userId) return NextResponse.json({ error: 'Non trovato' }, { status: 404 });
    const status = action === 'in_review' ? 'IN_REVIEW' : 'DRAFT';
    const item = await prisma.video.update({ where: { id }, data: { status: status as any } });
    return NextResponse.json({ ok: true, video: item });
  } catch {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
