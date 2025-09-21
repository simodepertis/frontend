import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

async function requireAuth(request: NextRequest) {
  const raw = getTokenFromRequest(request);
  if (!raw) return null;
  const payload = verifyToken(raw);
  if (!payload) return null;
  const u = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!u) return null;
  return { userId: u.id };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    const items = await prisma.document.findMany({ where: { userId: auth.userId }, orderBy: { createdAt: 'desc' }, take: 100 });
    return NextResponse.json({ documents: items });
  } catch {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    const body = await request.json();
    const id = Number(body?.id || 0);
    if (!id) return NextResponse.json({ error: 'ID non valido' }, { status: 400 });
    const d = await prisma.document.findUnique({ where: { id } });
    if (!d || d.userId !== auth.userId) return NextResponse.json({ error: 'Non trovato' }, { status: 404 });
    if (d.status !== 'IN_REVIEW') {
      await prisma.document.delete({ where: { id } });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
