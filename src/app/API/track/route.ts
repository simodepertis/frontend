import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const raw = getTokenFromRequest(request);
    if (!raw) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    const payload = verifyToken(raw);
    if (!payload) return NextResponse.json({ error: "Token non valido" }, { status: 401 });

    const body = await request.json();
    const { type, meta, targetUserId } = body || {};
    if (!type || !["VIEW", "CONTACT_CLICK", "SAVE", "BOOKING_CONFIRMED"].includes(type)) {
      return NextResponse.json({ error: "Tipo evento non valido" }, { status: 400 });
    }

    const userId = Number.isFinite(Number(targetUserId)) && Number(targetUserId) > 0 ? Number(targetUserId) : payload.userId;
    const event = await prisma.profileEvent.create({ data: { userId, type, meta: meta ?? null } });
    return NextResponse.json({ event });
  } catch (e) {
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
