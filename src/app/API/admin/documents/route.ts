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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'IN_REVIEW';

    const documents = await prisma.document.findMany({
      where: { status: status as any },
      include: {
        user: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      userId: doc.userId,
      userName: doc.user.nome,
      userEmail: doc.user.email,
      type: doc.type,
      status: doc.status,
      url: doc.url,
      createdAt: doc.createdAt.toISOString().split('T')[0]
    }));

    return NextResponse.json({ documents: formattedDocuments });
  } catch (error) {
    console.error('❌ Errore caricamento documenti:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adm = await requireAdmin(request);
    if (!adm) return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    
    const body = await request.json();
    const { documentId, action } = body;
    
    if (!documentId || !action) {
      return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 });
    }
    
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });
    }
    
    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
    
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: { status: newStatus },
    });
    
    return NextResponse.json({ 
      success: true, 
      document: updatedDocument,
      message: action === 'approve' ? 'Documento approvato con successo' : 'Documento rifiutato'
    });
  } catch (error) {
    console.error('❌ Errore approvazione documento:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
