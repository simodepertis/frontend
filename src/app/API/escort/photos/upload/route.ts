import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import path from "path";
import { promises as fs } from "fs";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const raw = getTokenFromRequest(request);
    if (!raw) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    const payload = verifyToken(raw);
    if (!payload) return NextResponse.json({ error: "Token non valido" }, { status: 401 });

    const form = await request.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "File mancante" }, { status: 400 });

    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Formato non supportato" }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "File troppo grande (max 5MB)" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
    const fname = `u${payload.userId}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const full = path.join(uploadsDir, fname);
    await fs.writeFile(full, buffer);

    const url = `/uploads/${fname}`;
    const created = await prisma.photo.create({ data: { userId: payload.userId, url, name: file.name, size: file.size } });

    return NextResponse.json({ photo: created });
  } catch (e) {
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
