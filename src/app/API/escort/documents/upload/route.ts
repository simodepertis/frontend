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
    const file = form.get('file') as File;
    const type = String(form.get('type') || 'identity').trim();
    
    // Validazione file
    if (!file) {
      return NextResponse.json({ error: 'Nessun file caricato' }, { status: 400 });
    }
    
    // Controllo tipo file
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Solo immagini sono accettate (JPG, PNG)' }, { status: 400 });
    }
    
    // Controllo dimensione file (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File troppo grande. Massimo 5MB' }, { status: 400 });
    }
    
    // Controllo dimensione minima (min 10KB per evitare file corrotti)
    if (file.size < 10 * 1024) {
      return NextResponse.json({ error: 'File troppo piccolo. Minimo 10KB' }, { status: 400 });
    }

    // Per ora salviamo come base64 (in produzione useresti un servizio di storage)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Determina il tipo di documento
    let docType = 'ID_CARD_FRONT';
    if (type === 'identity') docType = 'ID_CARD_FRONT';
    else if (type === 'passport') docType = 'PASSPORT';
    else if (type === 'license') docType = 'DRIVER_LICENSE';

    const doc = await (prisma as any).document.create({
      data: {
        userId: auth.userId,
        url: dataUrl, // Salviamo come data URL per semplicità
        type: docType as any,
        status: 'IN_REVIEW',
      }
    });

    return NextResponse.json({ 
      ok: true, 
      document: {
        id: doc.id,
        type: 'Documento di Identità',
        url: doc.url,
        status: 'IN_REVIEW'
      }
    });
  } catch (e) {
    console.error('Errore upload documento:', e);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
