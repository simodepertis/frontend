import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const perPage = Math.min(48, Math.max(1, Number(url.searchParams.get('perPage') || 12)));

    const where: any = { status: 'APPROVED' };

    const [total, items] = await Promise.all([
      prisma.video.count({ where }),
      prisma.video.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page-1)*perPage, take: perPage })
    ]);

    return NextResponse.json({ total, page, perPage, items });
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
