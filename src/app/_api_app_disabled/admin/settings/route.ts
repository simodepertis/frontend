import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

async function requireAdmin(request: NextRequest) {
  const raw = getTokenFromRequest(request);
  if (!raw) return null;
  const payload = verifyToken(raw);
  if (!payload) return null;
  // semplice check: ruolo === 'admin'
  // Se non hai ruolo admin ancora, temporaneamente permetti solo l'utente con email 'admin@local'
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
    let s = await prisma.adminSettings.findFirst();
    if (!s) s = await prisma.adminSettings.create({ data: {} });
    return NextResponse.json({ settings: s });
  } catch {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adm = await requireAdmin(request);
    if (!adm) return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    const body = await request.json();
    const creditValueCents = Number(body?.creditValueCents);
    const currency = typeof body?.currency === 'string' ? body.currency : undefined;
    let s = await prisma.adminSettings.findFirst();
    if (!s) s = await prisma.adminSettings.create({ data: {} });
    const updated = await prisma.adminSettings.update({ where: { id: s.id }, data: { creditValueCents: Number.isFinite(creditValueCents) && creditValueCents > 0 ? creditValueCents : undefined, currency } });
    return NextResponse.json({ settings: updated });
  } catch {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
