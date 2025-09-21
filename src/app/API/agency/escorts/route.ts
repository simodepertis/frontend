import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const raw = getTokenFromRequest(request);
    if (!raw) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    const payload = verifyToken(raw);
    if (!payload) return NextResponse.json({ error: "Token non valido" }, { status: 401 });

    // Lista escort collegate all'agenzia corrente
    const list = await prisma.escortProfile.findMany({
      where: { agencyId: payload.userId },
      include: { user: { select: { id: true, nome: true, email: true } } },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ escorts: list });
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

    const { escortUserId, action } = await request.json();
    if (!escortUserId || !["link", "unlink"].includes(action)) {
      return NextResponse.json({ error: "Parametri non validi" }, { status: 400 });
    }

    // Verifica che esista un profilo escort per quell'utente
    const prof = await prisma.escortProfile.findUnique({ where: { userId: Number(escortUserId) } });
    if (!prof) return NextResponse.json({ error: "Escort non trovata" }, { status: 404 });

    if (action === "link") {
      // Già collegata ad un'altra agenzia
      if (prof.agencyId && prof.agencyId !== payload.userId) {
        return NextResponse.json({ error: "Escort già collegata ad un'altra agenzia" }, { status: 409 });
      }
      const updated = await prisma.escortProfile.update({
        where: { userId: Number(escortUserId) },
        data: { agencyId: payload.userId },
      });
      return NextResponse.json({ escort: updated });
    }

    // unlink: consenti solo se l'agenzia attuale è proprietaria
    if (prof.agencyId !== payload.userId) {
      return NextResponse.json({ error: "Non autorizzato a scollegare questa escort" }, { status: 403 });
    }
    const updated = await prisma.escortProfile.update({
      where: { userId: Number(escortUserId) },
      data: { agencyId: null },
    });

    return NextResponse.json({ escort: updated });
  } catch (e) {
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
