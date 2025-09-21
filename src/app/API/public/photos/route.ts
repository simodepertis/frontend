import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const city = url.searchParams.get('city') || undefined;
    const tag = url.searchParams.get('tag') || undefined; // HD | Nuova | Verificata
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const perPage = Math.min(48, Math.max(1, Number(url.searchParams.get('perPage') || 12)));

    const where: any = { status: 'APPROVED' };
    if (city) where.meta = { path: ['city'], equals: city };
    // If tags are stored in meta; fallback: ignore

    const [total, items] = await Promise.all([
      prisma.photo.count({ where }),
      prisma.photo.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page-1)*perPage, take: perPage })
    ]);

    return NextResponse.json({ total, page, perPage, items });
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
