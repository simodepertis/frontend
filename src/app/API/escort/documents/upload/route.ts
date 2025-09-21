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

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const form = await request.formData();
    const url = String(form.get('url') || '').trim();
    const type = String(form.get('type') || '').trim();
    if (!url) return NextResponse.json({ error: 'Fornisci un URL valido del documento (immagine/pdf)' }, { status: 400 });
    if (!['ID_CARD_FRONT','ID_CARD_BACK','SELFIE_WITH_ID'].includes(type)) return NextResponse.json({ error: 'Tipo documento non valido' }, { status: 400 });

    const doc = await prisma.document.create({
      data: {
        userId: auth.userId,
        url,
        type: type as any,
        status: 'IN_REVIEW',
      }
    });

    return NextResponse.json({ ok: true, document: doc });
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
