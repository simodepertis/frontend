import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const raw = getTokenFromRequest(request);
    if (!raw) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    const payload = verifyToken(raw);
    if (!payload) return NextResponse.json({ error: "Token non valido" }, { status: 401 });

    const orders = await prisma.creditOrder.findMany({ where: { userId: payload.userId }, orderBy: { createdAt: 'desc' }, take: 50 });
    return NextResponse.json({ orders });
  } catch (e) {
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
