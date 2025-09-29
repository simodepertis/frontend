import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type ContactItem = {
  id?: number;
  name: string;
  languages?: string[];
  email?: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  role?: string;
  notes?: string;
};

// GET - Recupera tutti i contatti (admin)
export async function GET() {
  try {
    const contacts = await prisma.siteContact.findMany({
      orderBy: [{ sectionKey: 'asc' }, { createdAt: 'asc' }]
    });

    // Raggruppa per sezione
    const sectionsMap = new Map<string, any>();
    
    contacts.forEach((contact: any) => {
      if (!sectionsMap.has(contact.sectionKey)) {
        sectionsMap.set(contact.sectionKey, {
          key: contact.sectionKey,
          title: contact.sectionTitle,
          items: []
        });
      }
      
      sectionsMap.get(contact.sectionKey)!.items.push({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        whatsapp: contact.whatsapp,
        telegram: contact.telegram,
        languages: contact.languages,
        role: contact.role,
        notes: contact.notes
      });
    });

    const sections = Array.from(sectionsMap.values());
    return NextResponse.json({ sections });
  } catch (error) {
    console.error('❌ ERRORE in GET /api/admin/contacts:', error);
    return NextResponse.json({ error: 'Errore nel recupero dei contatti' }, { status: 500 });
  }
}

// POST - Aggiunge un contatto a una sezione
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sectionKey, sectionTitle, item } = body as { sectionKey: string; sectionTitle?: string; item: ContactItem };
    if (!sectionKey || !item || !item.name) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
    }

    const newContact = await prisma.siteContact.create({
      data: {
        name: item.name,
        email: item.email || null,
        phone: item.phone || null,
        whatsapp: item.whatsapp || null,
        telegram: item.telegram || null,
        languages: item.languages || [],
        role: item.role || null,
        notes: item.notes || null,
        sectionKey: sectionKey,
        sectionTitle: sectionTitle || sectionKey
      }
    });

    return NextResponse.json({ success: true, item: newContact });
  } catch (error) {
    console.error('❌ ERRORE in POST /api/admin/contacts:', error);
    return NextResponse.json({ error: 'Errore creazione contatto' }, { status: 500 });
  }
}

// PUT - Aggiorna un contatto esistente
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, item } = body as { id: number; sectionKey: string; item: Partial<ContactItem> };
    if (!id) return NextResponse.json({ error: 'ID mancante' }, { status: 400 });

    const updatedContact = await prisma.siteContact.update({
      where: { id },
      data: {
        name: item.name,
        email: item.email || null,
        phone: item.phone || null,
        whatsapp: item.whatsapp || null,
        telegram: item.telegram || null,
        languages: item.languages || [],
        role: item.role || null,
        notes: item.notes || null
      }
    });

    return NextResponse.json({ success: true, item: updatedContact });
  } catch (error) {
    console.error('❌ ERRORE in PUT /api/admin/contacts:', error);
    return NextResponse.json({ error: "Errore aggiornamento contatto" }, { status: 500 });
  }
}

// DELETE - Rimuove un contatto
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));
    if (!id) return NextResponse.json({ error: 'ID mancante' }, { status: 400 });

    await prisma.siteContact.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ ERRORE in DELETE /api/admin/contacts:', error);
    return NextResponse.json({ error: 'Errore eliminazione contatto' }, { status: 500 });
  }
}
