import { NextResponse } from 'next/server';

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
  console.log('📞 GET contatti pubblici - restituisco dati di default');
  return NextResponse.json(DEFAULT_CONTACTS);
}
