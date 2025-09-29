import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

type ContactItem = {
  id?: number;
  name: string;
  languages?: string[];
  email?: string;
  phone?: string;
  whatsapp?: string;
  role?: string;
  notes?: string;
};

type ContactSection = {
  key: string;
  title: string;
  items: ContactItem[];
};

type ContactsFile = { sections: ContactSection[] };

const filePath = path.join(process.cwd(), 'src', 'config', 'siteContacts.json');

async function readContacts(): Promise<ContactsFile> {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function writeContacts(data: ContactsFile) {
  const tmp = filePath + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tmp, filePath);
}

// GET - Recupera tutti i contatti (admin)
export async function GET() {
  try {
    const data = await readContacts();
    return NextResponse.json(data);
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

    const data = await readContacts();
    let section = data.sections.find(s => s.key === sectionKey);
    if (!section) {
      section = { key: sectionKey, title: sectionTitle || sectionKey, items: [] };
      data.sections.push(section);
    } else if (sectionTitle) {
      section.title = sectionTitle;
    }

    // assegna id incrementale
    const maxId = Math.max(0, ...data.sections.flatMap(s => s.items.map(i => i.id || 0)));
    item.id = maxId + 1;
    section.items.push(item);

    await writeContacts(data);
    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error('❌ ERRORE in POST /api/admin/contacts:', error);
    return NextResponse.json({ error: 'Errore creazione contatto' }, { status: 500 });
  }
}

// PUT - Aggiorna un contatto esistente
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, sectionKey, item } = body as { id: number; sectionKey: string; item: Partial<ContactItem> };
    if (!id || !sectionKey) return NextResponse.json({ error: 'ID o sezione mancanti' }, { status: 400 });

    const data = await readContacts();
    const section = data.sections.find(s => s.key === sectionKey);
    if (!section) return NextResponse.json({ error: 'Sezione non trovata' }, { status: 404 });
    const idx = section.items.findIndex(i => i.id === id);
    if (idx === -1) return NextResponse.json({ error: 'Contatto non trovato' }, { status: 404 });

    section.items[idx] = { ...section.items[idx], ...item };
    await writeContacts(data);
    return NextResponse.json({ success: true, item: section.items[idx] });
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
    const sectionKey = searchParams.get('sectionKey') || '';
    if (!id || !sectionKey) return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 });

    const data = await readContacts();
    const section = data.sections.find(s => s.key === sectionKey);
    if (!section) return NextResponse.json({ error: 'Sezione non trovata' }, { status: 404 });
    const before = section.items.length;
    section.items = section.items.filter(i => i.id !== id);
    if (section.items.length === before) return NextResponse.json({ error: 'Contatto non trovato' }, { status: 404 });

    await writeContacts(data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ ERRORE in DELETE /api/admin/contacts:', error);
    return NextResponse.json({ error: 'Errore eliminazione contatto' }, { status: 500 });
  }
}
