import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

export async function POST(request: NextRequest) {
  try {
    const raw = getTokenFromRequest(request);
    if (!raw) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    const payload = verifyToken(raw);
    if (!payload) return NextResponse.json({ error: "Token non valido" }, { status: 401 });

    const form = await request.formData();
    const orderId = Number(form.get('orderId'));
    const phone = String(form.get('phone') || '').trim();
    const file = form.get('file') as unknown as File | null;
    if (!orderId || !file) return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 });

    // Validazione file (max 5MB, tipi: jpg/jpeg/png/pdf)
    const allowed = ['image/jpeg','image/png','application/pdf'];
    const size = (file as any).size as number | undefined;
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Formato non valido. Consenti: JPG, PNG, PDF.' }, { status: 400 });
    }
    if (typeof size === 'number' && size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File troppo grande. Max 5MB.' }, { status: 400 });
    }

    const order = await prisma.creditOrder.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== payload.userId) return NextResponse.json({ error: 'Ordine non trovato' }, { status: 404 });
    if (order.status !== 'PENDING') return NextResponse.json({ error: 'Ordine non in stato PENDING' }, { status: 400 });

    // Save receipt under public/uploads/receipts
    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = (file.type && file.type.includes('png')) ? 'png' : (file.type && file.type.includes('jpeg')) ? 'jpg' : 'bin';
    const dir = path.join(process.cwd(), 'public', 'uploads', 'receipts');
    await mkdir(dir, { recursive: true });
    const filename = `order_${orderId}_${Date.now()}.${ext}`;
    const fullpath = path.join(dir, filename);
    await writeFile(fullpath, bytes);
    const publicUrl = `/uploads/receipts/${filename}`;

    // Produzione: NON accreditare. Restare in PENDING finché admin approva.
    await prisma.creditOrder.update({ where: { id: orderId }, data: { receiptUrl: publicUrl, phone: phone || order.phone || null } });

    return NextResponse.json({ ok: true, receiptUrl: publicUrl, message: 'Ricevuta caricata. L\'ordine sarà verificato da un amministratore.' });
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
