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
    const list = await prisma.creditProduct.findMany({ orderBy: { updatedAt: 'desc' } });
    return NextResponse.json({ products: list });
  } catch {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adm = await requireAdmin(request);
    if (!adm) return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    const body = await request.json();
    const code = String(body?.code || '').trim();
    const label = String(body?.label || '').trim();
    const creditsCost = Number(body?.creditsCost || 0);
    const durationDays = Number(body?.durationDays || 0);
    if (!code || !label || !Number.isFinite(creditsCost) || creditsCost <= 0 || !Number.isFinite(durationDays) || durationDays <= 0) {
      return NextResponse.json({ error: 'Dati non validi' }, { status: 400 });
    }
    const created = await prisma.creditProduct.create({ data: { code, label, creditsCost, durationDays, active: true } });
    return NextResponse.json({ product: created });
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
    if (!id) return NextResponse.json({ error: 'ID mancante' }, { status: 400 });
    const data: any = {};
    if (typeof body?.label === 'string') data.label = body.label;
    if (Number.isFinite(Number(body?.creditsCost))) data.creditsCost = Number(body.creditsCost);
    if (Number.isFinite(Number(body?.durationDays))) data.durationDays = Number(body.durationDays);
    if (typeof body?.active === 'boolean') data.active = body.active;
    const updated = await prisma.creditProduct.update({ where: { id }, data });
    return NextResponse.json({ product: updated });
  } catch {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
