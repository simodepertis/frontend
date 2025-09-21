import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    const auth = token ? verifyToken(token) : null;
    if (!auth?.userId) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const prof = await prisma.escortProfile.findUnique({ where: { userId: auth.userId } });
    if (!prof) return NextResponse.json({ error: 'Profilo escort non trovato' }, { status: 404 });

    const updated = await prisma.escortProfile.update({ where: { userId: auth.userId }, data: { updatedAt: new Date() } });
    return NextResponse.json({ ok: true, updatedAt: updated.updatedAt });
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
