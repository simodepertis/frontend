import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  try {
    const raw = getTokenFromRequest(request);
    if (!raw) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    const payload = verifyToken(raw);
    if (!payload) return NextResponse.json({ error: "Token non valido" }, { status: 401 });

    const { id, action } = await request.json();
    if (!id || !["in_review", "draft", "approved", "rejected"].includes(action)) {
      return NextResponse.json({ error: "Parametri non validi" }, { status: 400 });
    }

    const photo = await prisma.photo.findUnique({ where: { id: Number(id) } });
    if (!photo || photo.userId !== payload.userId) {
      return NextResponse.json({ error: "Foto non trovata" }, { status: 404 });
    }

    const status = action === 'in_review' ? 'IN_REVIEW' : action === 'approved' ? 'APPROVED' : action === 'rejected' ? 'REJECTED' : 'DRAFT';
    const updated = await prisma.photo.update({ where: { id: Number(id) }, data: { status } });
    return NextResponse.json({ photo: updated });
  } catch (e) {
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
