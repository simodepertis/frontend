import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const raw = getTokenFromRequest(request);
    if (!raw) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    const payload = verifyToken(raw);
    if (!payload) return NextResponse.json({ error: "Token non valido" }, { status: 401 });

    const photos = await prisma.photo.findMany({ where: { userId: payload.userId }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ photos });
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

    const { url, name, size } = await request.json();
    if (!url || !name || typeof size !== 'number') {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
    }

    const created = await prisma.photo.create({ data: { userId: payload.userId, url, name, size } });
    return NextResponse.json({ photo: created });
  } catch (e) {
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const raw = getTokenFromRequest(request);
    if (!raw) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    const payload = verifyToken(raw);
    if (!payload) return NextResponse.json({ error: "Token non valido" }, { status: 401 });

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "ID mancante" }, { status: 400 });

    // Assicura che la foto appartenga all'utente
    const p = await prisma.photo.findUnique({ where: { id } });
    if (!p || p.userId !== payload.userId) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

    await prisma.photo.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
