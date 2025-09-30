import { NextRequest, NextResponse } from 'next/server';

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

// Simulazione di storage in memoria (reset ad ogni deploy, ma funziona)
let contactsData = JSON.parse(JSON.stringify(DEFAULT_CONTACTS));

// GET - Recupera tutti i contatti
export async function GET() {
  try {
    console.log('📞 GET contatti - restituisco:', contactsData.sections.length, 'sezioni');
    return NextResponse.json(contactsData);
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

    // Trova o crea la sezione
    let section = contactsData.sections.find(s => s.key === sectionKey);
    if (!section) {
      section = { 
        key: sectionKey, 
        title: sectionTitle || sectionKey, 
        items: [] 
      };
      contactsData.sections.push(section);
    }

    // Calcola nuovo ID
    const maxId = Math.max(0, ...contactsData.sections.flatMap(s => s.items.map(i => i.id || 0)));
    const newContact = { ...item, id: maxId + 1 };
    
    section.items.push(newContact);
    
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

    const section = contactsData.sections.find(s => s.key === sectionKey);
    if (!section) {
      return NextResponse.json({ error: 'Sezione non trovata' }, { status: 404 });
    }

    const idx = section.items.findIndex(i => i.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Contatto non trovato' }, { status: 404 });
    }

    section.items[idx] = { ...section.items[idx], ...item, id };
    
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

    const section = contactsData.sections.find(s => s.key === sectionKey);
    if (!section) {
      return NextResponse.json({ error: 'Sezione non trovata' }, { status: 404 });
    }

    const before = section.items.length;
    section.items = section.items.filter(i => i.id !== id);
    
    if (section.items.length === before) {
      return NextResponse.json({ error: 'Contatto non trovato' }, { status: 404 });
    }

    console.log('✅ Contatto eliminato, ID:', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ ERRORE in DELETE /api/admin/contacts-simple:', error);
    return NextResponse.json({ error: 'Errore eliminazione contatto' }, { status: 500 });
  }
}
