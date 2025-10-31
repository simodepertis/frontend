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
  const whitelist = new Set(['admin@local', 'musicamagazine23@gmail.com', 'simodepertis@gmail.com']);
  if (u.ruolo === 'admin' || u.ruolo === 'owner' || u.ruolo === 'moderator' || whitelist.has(u.email)) return payload;
  // Temporary: allow any authenticated user for credits catalog management
  return payload;
}

export async function GET(request: NextRequest) {
  try {
    const adm = await requireAdmin(request);
    if (!adm) return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    const orderMap: Record<string, number> = { VIP: 1, ORO: 2, ARGENTO: 3, TITANIO: 4, GIRL: 5 };
    const list = await prisma.creditProduct.findMany();
    list.sort((a,b)=> (orderMap[a.code]||99)-(orderMap[b.code]||99));
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
    const toNum = (v: any, def: number|null = null) => {
      if (v === undefined || v === null) return def;
      if (typeof v === 'string' && v.trim() === '') return def;
      const n = Number(v); return Number.isFinite(n) ? n : def;
    };
    const creditsCost = toNum(body?.creditsCost, 0) ?? 0;
    const durationDays = toNum(body?.durationDays, 1) ?? 1;
    const pricePerDayCredits = toNum(body?.pricePerDayCredits, null);
    const minDays = toNum(body?.minDays, null);
    const maxDays = toNum(body?.maxDays, null);
    const active = body?.active === undefined ? true : Boolean(body?.active);
    if (!code || !label) {
      return NextResponse.json({ error: 'code e label obbligatori' }, { status: 400 });
    }
    const created = await prisma.creditProduct.create({ data: { code, label, creditsCost, durationDays, pricePerDayCredits, minDays, maxDays, active } });
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
    const toNum = (v: any, def: number|null = null) => {
      if (v === undefined || v === null) return def;
      if (typeof v === 'string' && v.trim() === '') return def;
      const n = Number(v); return Number.isFinite(n) ? n : def;
    };
    if (!id) return NextResponse.json({ error: 'ID mancante' }, { status: 400 });
    const data: any = {};
    if (typeof body?.label === 'string') data.label = body.label;
    if (body?.creditsCost !== undefined) data.creditsCost = toNum(body.creditsCost, 0) ?? 0;
    if (body?.durationDays !== undefined) data.durationDays = toNum(body.durationDays, 1) ?? 1;
    if (body?.pricePerDayCredits !== undefined) data.pricePerDayCredits = toNum(body.pricePerDayCredits, null);
    if (body?.minDays !== undefined) data.minDays = toNum(body.minDays, null);
    if (body?.maxDays !== undefined) data.maxDays = toNum(body.maxDays, null);
    if (typeof body?.active === 'boolean') data.active = body.active;
    const updated = await prisma.creditProduct.update({ where: { id }, data });
    return NextResponse.json({ product: updated });
  } catch {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
