import { NextRequest, NextResponse } from 'next/server';

// API che restituisce sempre i dati di default
// Il vero storage è nel localStorage del browser

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

// GET - Restituisce sempre i dati di default (il localStorage gestisce tutto lato client)
export async function GET() {
  console.log('📞 GET contatti - restituisco dati di default');
  return NextResponse.json(DEFAULT_CONTACTS);
}

// POST - Simula successo (il localStorage gestisce tutto lato client)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('💾 POST contatto simulato:', body);
    
    // Simula un ID
    const newContact = { ...body.item, id: Date.now() };
    
    return NextResponse.json({ success: true, item: newContact });
  } catch (error) {
    console.error('❌ ERRORE in POST:', error);
    return NextResponse.json({ error: 'Errore creazione contatto' }, { status: 500 });
  }
}

// PUT - Simula successo (il localStorage gestisce tutto lato client)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('✏️ PUT contatto simulato:', body);
    
    return NextResponse.json({ success: true, item: body.item });
  } catch (error) {
    console.error('❌ ERRORE in PUT:', error);
    return NextResponse.json({ error: 'Errore aggiornamento contatto' }, { status: 500 });
  }
}

// DELETE - Simula successo (il localStorage gestisce tutto lato client)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    console.log('🗑️ DELETE contatto simulato, ID:', id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ ERRORE in DELETE:', error);
    return NextResponse.json({ error: 'Errore eliminazione contatto' }, { status: 500 });
  }
}
