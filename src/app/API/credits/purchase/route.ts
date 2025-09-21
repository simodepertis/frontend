import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const raw = getTokenFromRequest(request);
    if (!raw) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    const payload = verifyToken(raw);
    if (!payload) return NextResponse.json({ error: "Token non valido" }, { status: 401 });

    const body = await request.json();
    const qty = Number(body?.credits || 0);
    const method = String(body?.method || 'manual_bollettino'); // 'skrill' | 'manual_bonifico' | 'manual_bollettino'
    const phone = typeof body?.phone === 'string' ? body.phone : undefined;
    if (!Number.isFinite(qty) || qty < 10) {
      return NextResponse.json({ error: 'Minimo 10 crediti' }, { status: 400 });
    }

    // For now, handle only manual flows (bollettino/bonifico). Skrill will be wired later via hosted session.
    const order = await prisma.creditOrder.create({
      data: {
        userId: payload.userId,
        credits: qty,
        method,
        status: 'PENDING',
        phone: phone || null,
      },
    });

    // Provide instructions for bollettino
    const istruzioni = method === 'manual_bollettino'
      ? {
          tipo: 'bollettino',
          conto: 'C/C N. 001043493061',
          intestatoA: 'Infinityweb.SRLs',
          indirizzo: 'via Livorno 4 /B Modugno 70026 Bari',
          causale: `ACQUISTO CREDITI ${phone || ''}`.trim(),
          note: 'Carica una foto del bollettino pagato con il numero di telefono in causale.',
        }
      : method === 'manual_bonifico'
      ? {
          tipo: 'bonifico',
          intestatario: 'Sorrentino Raffaele',
          iban: 'IT44D0326804000052662637180',
          causale: `ACQUISTO CREDITI ${phone || ''}`.trim(),
          note: 'Carica la ricevuta del bonifico istantaneo con il numero di telefono in causale.',
        }
      : { tipo: 'altro' };

    return NextResponse.json({ ok: true, order, istruzioni });
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
