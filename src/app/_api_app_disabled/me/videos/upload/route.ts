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
    const urlInput = (form.get('url') as string | null) || undefined; // optional external url
    const title = (form.get('title') as string | null) || 'Video';
    const duration = (form.get('duration') as string | null) || undefined;

    let publicUrl = urlInput;
    let thumb: string | undefined;

    if (!publicUrl && file) {
      const allowed = ['video/mp4','video/webm','video/ogg'];
      if (!allowed.includes(file.type)) return NextResponse.json({ error: 'Formato video non consentito' }, { status: 400 });
      if (file.size > 50*1024*1024) return NextResponse.json({ error: 'File troppo grande (max 50MB)' }, { status: 400 });
      const arrayBuf = await file.arrayBuffer();
      const buff = Buffer.from(arrayBuf);
      const dir = `public/uploads/videos/${payload.userId}`;
      await mkdir(dir, { recursive: true });
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${extname(file.name || '.mp4')}`;
      const fsPath = `${dir}/${name}`;
      await writeFile(fsPath, buff);
      publicUrl = `/uploads/videos/${payload.userId}/${name}`;
      // thumb could be created server-side with ffmpeg in future; for now optional
    }

    if (!publicUrl) return NextResponse.json({ error: 'Fornire file o url' }, { status: 400 });

    const status = process.env.NODE_ENV !== 'production' ? 'APPROVED' : 'IN_REVIEW';
    const created = await prisma.video.create({ data: { userId: payload.userId, url: publicUrl, thumb, title, duration, status: status as any } });
    return NextResponse.json({ ok: true, video: created });
  } catch (e) {
    return NextResponse.json({ error: 'Errore upload video' }, { status: 500 });
  }
}
