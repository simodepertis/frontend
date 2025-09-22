import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

async function requireAdmin(request: NextRequest) {
  const raw = getTokenFromRequest(request);
  if (!raw) return null;
  const payload = verifyToken(raw);
  if (!payload) return null;
  const u = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!u) return null;
  // Check if user is admin by role only
  if (u.ruolo === 'admin') return payload;
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const adm = await requireAdmin(request);
    if (!adm) return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    
    const url = new URL(request.url);
    const role = url.searchParams.get('role');
    
    const whereClause = role && role !== 'all' ? { ruolo: role } : {};
    
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        nome: true,
        email: true,
        ruolo: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('❌ Errore caricamento utenti:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adm = await requireAdmin(request);
    if (!adm) return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    
    const body = await request.json();
    const { userId, action, newRole } = body;
    
    if (!userId || !action) {
      return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 });
    }
    
    if (action === 'changeRole') {
      if (!newRole || !['user', 'escort', 'agency', 'admin'].includes(newRole)) {
        return NextResponse.json({ error: 'Ruolo non valido' }, { status: 400 });
      }
      
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { ruolo: newRole },
      });
      
      return NextResponse.json({ success: true, user: updatedUser });
    }
    
    return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });
  } catch (error) {
    console.error('❌ Errore aggiornamento utente:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adm = await requireAdmin(request);
    if (!adm) return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'ID utente mancante' }, { status: 400 });
    }
    
    // Don't allow deleting admin users
    const userToDelete = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });
    
    if (!userToDelete) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
    }
    
    if (userToDelete.ruolo === 'admin') {
      return NextResponse.json({ error: 'Non puoi eliminare un amministratore' }, { status: 403 });
    }
    
    await prisma.user.delete({
      where: { id: parseInt(userId) },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Errore eliminazione utente:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
