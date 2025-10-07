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
    const items = await prisma.review.findMany({
      where: { status: status as any },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { id: true, rating: true, title: true, body: true, createdAt: true, author: { select: { id: true, nome: true } }, target: { select: { id: true, nome: true } } }
    });
    return NextResponse.json({ items });
  } catch {
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
    if (!id || !['approve','reject'].includes(action)) return NextResponse.json({ error: 'Parametri non validi' }, { status: 400 });
    const status = action === 'approve' ? 'APPROVED' : 'REJECTED';
    const item = await prisma.review.update({ where: { id }, data: { status: status as any } });
    return NextResponse.json({ ok: true, item });
  } catch {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

// Bulk cleanup endpoint: reject/delete reviews matching a phrase or by IDs
export async function POST(request: NextRequest) {
  try {
    const adm = await requireAdmin(request);
    if (!adm) return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    const body = await request.json().catch(()=>({}));
    const mode = String(body?.mode || '').toLowerCase();
    if (!['reject_by_phrase','delete_by_phrase','reject_by_ids','delete_by_ids'].includes(mode)) {
      return NextResponse.json({ error: 'Parametri non validi (mode)' }, { status: 400 });
    }

    if (mode.endsWith('_by_phrase')) {
      const phrase = String(body?.phrase || '').trim();
      if (!phrase) return NextResponse.json({ error: 'Frase richiesta' }, { status: 400 });
      if (mode.startsWith('reject')) {
        const r = await prisma.review.updateMany({
          where: {
            OR: [
              { body: { contains: phrase, mode: 'insensitive' } as any },
              { title: { contains: phrase, mode: 'insensitive' } as any },
            ],
          },
          data: { status: 'REJECTED' as any },
        });
        return NextResponse.json({ ok: true, count: r.count });
      } else {
        const r = await prisma.review.deleteMany({
          where: {
            OR: [
              { body: { contains: phrase, mode: 'insensitive' } as any },
              { title: { contains: phrase, mode: 'insensitive' } as any },
            ],
          },
        });
        return NextResponse.json({ ok: true, count: r.count });
      }
    }

    if (mode.endsWith('_by_ids')) {
      const ids = Array.isArray(body?.ids) ? body.ids.map((x:any)=>Number(x)).filter((n:number)=>Number.isFinite(n) && n>0) : [];
      if (!ids.length) return NextResponse.json({ error: 'ids[] richiesto' }, { status: 400 });
      if (mode.startsWith('reject')) {
        const r = await prisma.review.updateMany({ where: { id: { in: ids } }, data: { status: 'REJECTED' as any } });
        return NextResponse.json({ ok: true, count: r.count });
      } else {
        const r = await prisma.review.deleteMany({ where: { id: { in: ids } } });
        return NextResponse.json({ ok: true, count: r.count });
      }
    }

    return NextResponse.json({ error: 'Nessuna azione eseguita' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
