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
    const status = String(new URL(request.url).searchParams.get('status') || 'PENDING').toUpperCase();
    const orders = await prisma.creditOrder.findMany({ where: { status: status as any }, orderBy: { createdAt: 'desc' }, take: 100 });
    return NextResponse.json({ orders });
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
    const action = String(body?.action || '').toLowerCase(); // 'approve' | 'reject'
    if (!id || !['approve', 'reject'].includes(action)) return NextResponse.json({ error: 'Parametri non validi' }, { status: 400 });

    if (action === 'approve') {
      const result = await prisma.$transaction(async (tx) => {
        const order = await tx.creditOrder.update({ where: { id }, data: { status: 'PAID' } });
        let wallet = await tx.creditWallet.findUnique({ where: { userId: order.userId } });
        if (!wallet) wallet = await tx.creditWallet.create({ data: { userId: order.userId, balance: 0 } });
        await tx.creditTransaction.create({ data: { userId: order.userId, amount: order.credits, type: 'PURCHASE', reference: order.method.toUpperCase() } });
        const updatedWallet = await tx.creditWallet.update({ where: { userId: order.userId }, data: { balance: { increment: order.credits } } });
        return { order, wallet: updatedWallet };
      });
      return NextResponse.json({ ok: true, order: result.order, wallet: { balance: result.wallet.balance } });
    } else {
      const order = await prisma.creditOrder.update({ where: { id }, data: { status: 'FAILED' } });
      return NextResponse.json({ ok: true, order });
    }
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
