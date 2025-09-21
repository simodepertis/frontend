import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const raw = getTokenFromRequest(request);
    if (!raw) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    const payload = verifyToken(raw);
    if (!payload) return NextResponse.json({ error: "Token non valido" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, nome: true, email: true, ruolo: true, createdAt: true }
    });
    if (!user) return NextResponse.json({ error: "Utente non trovato" }, { status: 404 });

    return NextResponse.json({ user });
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

    const body = await request.json();
    const { nome, email } = body as { nome?: string; email?: string };
    if (!nome && !email) return NextResponse.json({ error: "Nessun campo da aggiornare" }, { status: 400 });

    const updated = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        ...(typeof nome === 'string' && nome.trim().length > 0 ? { nome } : {}),
        ...(typeof email === 'string' && email.trim().length > 0 ? { email } : {}),
      },
      select: { id: true, nome: true, email: true, ruolo: true, createdAt: true }
    });

    return NextResponse.json({ user: updated });
  } catch (e) {
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
