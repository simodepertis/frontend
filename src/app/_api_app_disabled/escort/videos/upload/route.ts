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
    const title = String(form.get('title') || '').trim() || 'Video';
    const thumb = String(form.get('thumb') || '').trim() || null;
    const duration = String(form.get('duration') || '').trim() || null;
    const hd = String(form.get('hd') || '').toLowerCase() === 'true';

    if (!url) {
      return NextResponse.json({ error: 'Fornisci un URL video valido (mp4, m3u8, ecc.)' }, { status: 400 });
    }

    const video = await prisma.video.create({
      data: {
        userId: auth.userId,
        url,
        title,
        thumb: thumb || undefined,
        duration: duration || undefined,
        hd,
        status: 'DRAFT',
      }
    });

    return NextResponse.json({ ok: true, video });
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
