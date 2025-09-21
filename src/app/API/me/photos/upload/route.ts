import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { writeFile, mkdir } from "node:fs/promises";
import { extname } from "node:path";

export async function POST(request: NextRequest) {
  try {
    const raw = getTokenFromRequest(request);
    const payload = verifyToken(raw || "");
    if (!payload) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const form = await request.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'File mancante' }, { status: 400 });
    const allowed = ['image/jpeg','image/png','image/webp'];
    if (!allowed.includes(file.type)) return NextResponse.json({ error: 'Formato non consentito' }, { status: 400 });
    if (file.size > 5*1024*1024) return NextResponse.json({ error: 'File troppo grande (max 5MB)' }, { status: 400 });

    const arrayBuf = await file.arrayBuffer();
    const buff = Buffer.from(arrayBuf);
    const dir = `public/uploads/photos/${payload.userId}`;
    await mkdir(dir, { recursive: true });
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${extname(file.name || '.jpg')}`;
    const fsPath = `${dir}/${name}`;
    await writeFile(fsPath, buff);
    const publicUrl = `/uploads/photos/${payload.userId}/${name}`;

    const status = process.env.NODE_ENV !== 'production' ? 'APPROVED' : 'IN_REVIEW';
    const created = await prisma.photo.create({ data: { userId: payload.userId, url: publicUrl, name: file.name || name, size: file.size, status: status as any } });
    return NextResponse.json({ ok: true, photo: created });
  } catch (e) {
    return NextResponse.json({ error: 'Errore upload' }, { status: 500 });
  }
}
