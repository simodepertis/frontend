import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

async function requireAdmin(request: NextRequest) {
  const raw = getTokenFromRequest(request);
  if (!raw) return null;
  const payload = verifyToken(raw);
  if (!payload) return null;
  const u = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!u) return null;
  const whitelist = new Set(['admin@local', 'musicamagazine23@gmail.com']);
  if (u.ruolo === 'admin' || whitelist.has(u.email)) return payload;
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const adm = await requireAdmin(request);
    if (!adm) return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    const status = String(new URL(request.url).searchParams.get('status') || 'IN_REVIEW');
    const items = await prisma.comment.findMany({
      where: { status: status as any },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        body: true,
        createdAt: true,
        author: { select: { id: true, nome: true, email: true } },
        target: { select: { id: true, nome: true, slug: true } },
      },
    });
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adm = await requireAdmin(request);
    if (!adm) return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    const body = await request.json();
    const id = Number(body?.id || 0);
    const action = String(body?.action || '').toLowerCase();
    if (!id || !['approve','reject','delete'].includes(action)) {
      return NextResponse.json({ error: 'Parametri non validi' }, { status: 400 });
    }
    if (action === 'delete') {
      await prisma.comment.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    }
    const status = action === 'approve' ? 'APPROVED' : 'REJECTED';
    const item = await prisma.comment.update({ where: { id }, data: { status: status as any } });
    return NextResponse.json({ ok: true, item });
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
