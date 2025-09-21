import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function ensureDefaults() {
  const count = await prisma.creditProduct.count();
  if (count === 0) {
    await prisma.creditProduct.createMany({ data: [
      { code: 'VIP_7D', label: 'VIP 7 Giorni', creditsCost: 100, durationDays: 7, active: true },
      { code: 'TITANIO_30D', label: 'Titanio 30 Giorni', creditsCost: 150, durationDays: 30, active: true },
      { code: 'ORO_30D', label: 'Oro 30 Giorni', creditsCost: 80, durationDays: 30, active: true },
      { code: 'ARGENTO_30D', label: 'Argento 30 Giorni', creditsCost: 40, durationDays: 30, active: true },
    ]});
  }
}

export async function GET(_request: NextRequest) {
  try {
    await ensureDefaults();
    const list = await prisma.creditProduct.findMany({ where: { active: true }, orderBy: { creditsCost: 'asc' } });
    return NextResponse.json({ products: list });
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
