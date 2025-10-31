import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const raw = getTokenFromRequest(request);
    if (!raw) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    const payload = verifyToken(raw);
    if (!payload) return NextResponse.json({ error: "Token non valido" }, { status: 401 });

    const list = await prisma.bookingRequest.findMany({ where: { userId: payload.userId }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ requests: list });
  } catch (e) {
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const raw = getTokenFromRequest(request);
    if (!raw) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    const payload = verifyToken(raw);
    if (!payload) return NextResponse.json({ error: "Token non valido" }, { status: 401 });

    const { name, when, duration, note } = await request.json();
    if (!name || !when || !duration) return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });

    const created = await prisma.bookingRequest.create({ data: { userId: payload.userId, name, when, duration, note } });
    return NextResponse.json({ request: created });
  } catch (e) {
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const raw = getTokenFromRequest(request);
    if (!raw) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    const payload = verifyToken(raw);
    if (!payload) return NextResponse.json({ error: "Token non valido" }, { status: 401 });

    const { id, action } = await request.json();
    if (!id || !["accept", "decline"].includes(action)) {
      return NextResponse.json({ error: "Parametri non validi" }, { status: 400 });
    }

    const req = await prisma.bookingRequest.findUnique({ where: { id } });
    if (!req || req.userId !== payload.userId) return NextResponse.json({ error: "Richiesta non trovata" }, { status: 404 });

    const updated = await prisma.bookingRequest.update({
      where: { id },
      data: { status: action === "accept" ? "ACCEPTED" : "DECLINED" },
    });
    if (action === 'accept') {
      try {
        await prisma.profileEvent.create({ data: { userId: payload.userId, type: 'BOOKING_CONFIRMED', meta: { requestId: id } } });
      } catch {}
    }
    return NextResponse.json({ request: updated });
  } catch (e) {
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
