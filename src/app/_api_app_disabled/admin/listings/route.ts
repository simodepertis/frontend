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
    const items = await prisma.listing.findMany({
      where: { status: status as any },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, nome: true, slug: true } } },
      take: 200,
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
    const action = String(body?.action || '').toUpperCase();
    const reason = String(body?.reason || '').trim() || null;
    if (!id || !['PUBLISH','REJECT'].includes(action)) return NextResponse.json({ error: 'Parametri non validi' }, { status: 400 });

    const status = action === 'PUBLISH' ? 'PUBLISHED' : 'REJECTED';
    const item = await prisma.listing.update({ where: { id }, data: { status: status as any, meta: reason ? ({ moderationReason: reason } as any) : undefined } as any });
    return NextResponse.json({ ok: true, item });
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
