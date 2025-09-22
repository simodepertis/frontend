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
  return u;
}

export async function GET(request: NextRequest) {
  try {
    const u = await requireAuth(request);
    if (!u) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    console.log('✅ API /user/me - Utente:', u.id, u.email, u.ruolo);

    return NextResponse.json({
      user: {
        id: u.id,
        nome: u.nome,
        email: u.email,
        ruolo: u.ruolo,
        createdAt: u.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Errore API /user/me:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
