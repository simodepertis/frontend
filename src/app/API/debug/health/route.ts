import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const userCount = await prisma.user.count().catch(() => -1);
    const adminUser = await prisma.user.findUnique({ 
      where: { email: "simodepertis@gmail.com" },
      select: { id: true, email: true, ruolo: true, nome: true }
    }).catch(() => null);
    return NextResponse.json({ ok: true, db: "reachable", userCount, adminUser });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
