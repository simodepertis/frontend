import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { mkdir, readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

const baseDir = join(process.cwd(), "public", "uploads", "blacklist");

async function loadList(userId: number) {
  const file = join(baseDir, `${userId}.json`);
  if (!existsSync(file)) return [] as any[];
  try {
    const buff = await readFile(file, "utf-8");
    return JSON.parse(buff);
  } catch {
    return [] as any[];
  }
}

async function saveList(userId: number, items: any[]) {
  const file = join(baseDir, `${userId}.json`);
  await mkdir(baseDir, { recursive: true });
  await writeFile(file, JSON.stringify(items, null, 2), "utf-8");
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth?.userId) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    const items = await loadList(auth.userId);
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth?.userId) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const entry = {
      id: Date.now().toString(36),
      name: String(body?.name || ''),
      phone: String(body?.phone || ''),
      note: String(body?.note || ''),
      createdAt: new Date().toISOString(),
    };
    const items = await loadList(auth.userId);
    items.unshift(entry);
    await saveList(auth.userId, items);
    return NextResponse.json({ ok: true, item: entry });
  } catch {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuth(req);
    if (!auth?.userId) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const id = String(body?.id || '');
    if (!id) return NextResponse.json({ error: 'ID mancante' }, { status: 400 });
    const items = await loadList(auth.userId);
    const filtered = items.filter((x: any) => x.id !== id);
    await saveList(auth.userId, filtered);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
