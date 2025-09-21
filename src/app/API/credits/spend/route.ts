import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

function mapProductToTier(code: string) {
  if (code.startsWith('VIP')) return 'VIP' as const;
  if (code.startsWith('TITANIO')) return 'TITANIO' as const;
  if (code.startsWith('ORO')) return 'ORO' as const;
  if (code.startsWith('ARGENTO')) return 'ARGENTO' as const;
  return 'STANDARD' as const;
}

export async function POST(request: NextRequest) {
  try {
    const raw = getTokenFromRequest(request);
    if (!raw) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    const payload = verifyToken(raw);
    if (!payload) return NextResponse.json({ error: "Token non valido" }, { status: 401 });

    const body = await request.json();
    const code = String(body?.code || '').trim();
    if (!code) return NextResponse.json({ error: 'Codice prodotto mancante' }, { status: 400 });

    const product = await prisma.creditProduct.findUnique({ where: { code } });
    if (!product || !product.active) return NextResponse.json({ error: 'Prodotto non valido' }, { status: 400 });

    // Ensure wallet
    let wallet = await prisma.creditWallet.findUnique({ where: { userId: payload.userId } });
    if (!wallet) wallet = await prisma.creditWallet.create({ data: { userId: payload.userId, balance: 0 } });

    if (wallet.balance < product.creditsCost) {
      return NextResponse.json({ error: 'Crediti insufficienti' }, { status: 402 });
    }

    // Spend & activate tier
    const tier = mapProductToTier(product.code);
    const now = new Date();
    const expires = new Date(now.getTime() + product.durationDays * 24 * 60 * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.creditWallet.update({
        where: { userId: payload.userId },
        data: { balance: { decrement: product.creditsCost } },
      });
      await tx.creditTransaction.create({ data: { userId: payload.userId, amount: -product.creditsCost, type: 'SPEND', reference: product.code } });
      await tx.escortProfile.upsert({
        where: { userId: payload.userId },
        update: { tier, tierExpiresAt: expires },
        create: { userId: payload.userId, tier, tierExpiresAt: expires },
      });
      return updatedWallet;
    });

    return NextResponse.json({ ok: true, wallet: { balance: result.balance }, activated: { tier, expiresAt: expires.toISOString() } });
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
