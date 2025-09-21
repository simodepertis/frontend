import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken, verifyPassword, hashPassword } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  try {
    const raw = getTokenFromRequest(request);
    if (!raw) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    const payload = verifyToken(raw);
    if (!payload) return NextResponse.json({ error: "Token non valido" }, { status: 401 });

    const { oldPassword, newPassword } = (await request.json()) as {
      oldPassword?: string;
      newPassword?: string;
    };

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: "Compila tutti i campi" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "La nuova password deve essere di almeno 6 caratteri" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return NextResponse.json({ error: "Utente non trovato" }, { status: 404 });

    const ok = await verifyPassword(oldPassword, user.password);
    if (!ok) return NextResponse.json({ error: "Password attuale errata" }, { status: 401 });

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

    return NextResponse.json({ message: "Password aggiornata" });
  } catch (e) {
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
