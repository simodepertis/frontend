import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Contatti hardcoded che funzionano sempre
const DEFAULT_CONTACTS = {
  sections: [
    {
      key: 'annunci',
      title: 'Contatti per annunci',
      items: [
        {
          id: 1,
          name: 'Francesco',
          email: 'francesco@incontriescort.org',
          phone: '+41 32 580 08 93',
          whatsapp: '+41 762031758',
          languages: ['Italian', 'English', 'Hungarian']
        },
        {
          id: 2,
          name: 'Marco',
          email: 'marco@incontriescort.org',
          languages: ['English']
        }
      ]
    },
    {
      key: 'altri-problemi',
      title: 'Contattare per altri problemi',
      items: [
        {
          id: 3,
          name: 'Contatto per forum',
          email: 'forum@incontriescort.org',
          languages: ['Italian', 'English'],
          role: 'forum'
        },
        {
          id: 4,
          name: 'Contatti per utenti, recensioni, commenti e altro',
          email: 'info@incontriescort.org',
          languages: ['Italian', 'English'],
          role: 'utenti'
        },
        {
          id: 5,
          name: 'Contatto per problemi non risolti o lamentele',
          email: 'support@incontriescort.org',
          languages: ['Italian', 'English'],
          role: 'supporto',
          notes: "(Si prega di contattare il supporto SOLO se il suo problema NON è stato risolto dall'Admin o dal suo agente di vendita)"
        }
      ]
    }
  ]
};

// Percorso del file JSON
const CONTACTS_FILE = path.join(process.cwd(), 'contacts-data.json');

// Funzioni per leggere e scrivere il file
async function readContactsFile() {
  try {
    const data = await fs.readFile(CONTACTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Se il file non esiste, crealo con i dati di default
    await writeContactsFile(DEFAULT_CONTACTS);
    return DEFAULT_CONTACTS;
  }
}

async function writeContactsFile(data: any) {
  try {
    await fs.writeFile(CONTACTS_FILE, JSON.stringify(data, null, 2), 'utf8');
    console.log('✅ File contatti salvato:', CONTACTS_FILE);
  } catch (error) {
    console.error('❌ Errore scrittura file contatti:', error);
    throw error;
  }
}

// GET - Recupera tutti i contatti
export async function GET() {
  try {
    const data = await readContactsFile();
    console.log('📞 GET contatti - restituisco:', data.sections.length, 'sezioni');
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ ERRORE in GET /api/admin/contacts-simple:', error);
    return NextResponse.json(DEFAULT_CONTACTS);
  }
}

// POST - Aggiunge un contatto
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sectionKey, sectionTitle, item } = body;
    
    console.log('💾 POST contatto:', { sectionKey, item });
    
    if (!sectionKey || !item || !item.name) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
    }

    // Leggi i contatti attuali
    const data = await readContactsFile();

    // Trova o crea la sezione
    let section = data.sections.find((s: any) => s.key === sectionKey);
    if (!section) {
      section = { 
        key: sectionKey, 
        title: sectionTitle || sectionKey, 
        items: [] 
      };
      data.sections.push(section);
    }

    // Calcola nuovo ID
    const maxId = Math.max(0, ...data.sections.flatMap((s: any) => s.items.map((i: any) => i.id || 0)));
    const newContact = { ...item, id: maxId + 1 };
    
    section.items.push(newContact);
    
    // Salva il file aggiornato
    await writeContactsFile(data);
    
    console.log('✅ Contatto aggiunto:', newContact);
    return NextResponse.json({ success: true, item: newContact });
  } catch (error) {
    console.error('❌ ERRORE in POST /api/admin/contacts-simple:', error);
    return NextResponse.json({ error: 'Errore creazione contatto' }, { status: 500 });
  }
}

// PUT - Aggiorna un contatto
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, sectionKey, item } = body;
    
    if (!id || !sectionKey) {
      return NextResponse.json({ error: 'ID o sezione mancanti' }, { status: 400 });
    }

    // Leggi i contatti attuali
    const data = await readContactsFile();

    const section = data.sections.find((s: any) => s.key === sectionKey);
    if (!section) {
      return NextResponse.json({ error: 'Sezione non trovata' }, { status: 404 });
    }

    const idx = section.items.findIndex((i: any) => i.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Contatto non trovato' }, { status: 404 });
    }

    section.items[idx] = { ...section.items[idx], ...item, id };
    
    // Salva il file aggiornato
    await writeContactsFile(data);
    
    console.log('✅ Contatto aggiornato:', section.items[idx]);
    return NextResponse.json({ success: true, item: section.items[idx] });
  } catch (error) {
    console.error('❌ ERRORE in PUT /api/admin/contacts-simple:', error);
    return NextResponse.json({ error: 'Errore aggiornamento contatto' }, { status: 500 });
  }
}

// DELETE - Elimina un contatto
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));
    const sectionKey = searchParams.get('sectionKey') || '';
    
    if (!id || !sectionKey) {
      return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 });
    }

    // Leggi i contatti attuali
    const data = await readContactsFile();

    const section = data.sections.find((s: any) => s.key === sectionKey);
    if (!section) {
      return NextResponse.json({ error: 'Sezione non trovata' }, { status: 404 });
    }

    const before = section.items.length;
    section.items = section.items.filter((i: any) => i.id !== id);
    
    if (section.items.length === before) {
      return NextResponse.json({ error: 'Contatto non trovato' }, { status: 404 });
    }
    
    // Salva il file aggiornato
    await writeContactsFile(data);

    console.log('✅ Contatto eliminato, ID:', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ ERRORE in DELETE /api/admin/contacts-simple:', error);
    return NextResponse.json({ error: 'Errore eliminazione contatto' }, { status: 500 });
  }
}
