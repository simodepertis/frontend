import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Importa direttamente la logica dall'API admin per evitare chiamate HTTP interne
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

// Percorso del file JSON (stesso dell'admin)
const CONTACTS_FILE = path.join(process.cwd(), 'contacts-data.json');

// Funzione per leggere il file
async function readContactsFile() {
  try {
    const data = await fs.readFile(CONTACTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Se il file non esiste, restituisci i default
    return DEFAULT_CONTACTS;
  }
}

// GET - Recupera contatti per la pagina pubblica
export async function GET() {
  try {
    console.log('📞 Caricamento contatti pubblici dal file...');
    
    const data = await readContactsFile();
    console.log('✅ Contatti pubblici caricati:', data.sections?.length || 0, 'sezioni');
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ ERRORE in GET /api/public/contacts-simple:', error);
    
    // Fallback ai contatti di default
    return NextResponse.json({
      sections: [
        {
          key: "annunci",
          title: "Contatti per annunci",
          items: [
            {
              id: 1,
              name: "Francesco",
              languages: ["Italian", "English", "Hungarian"],
              phone: "+41 32 580 08 93",
              email: "francesco@incontriescort.org",
              whatsapp: "+41 762031758"
            },
            {
              id: 2,
              name: "Marco",
              languages: ["English"],
              email: "marco@incontriescort.org"
            }
          ]
        },
        {
          key: "altri-problemi",
          title: "Contattare per altri problemi",
          items: [
            {
              id: 3,
              name: "Contatto per forum",
              languages: ["Italian", "English"],
              email: "forum@incontriescort.org",
              role: "forum"
            },
            {
              id: 4,
              name: "Contatti per utenti, recensioni, commenti e altro",
              languages: ["Italian", "English"],
              email: "info@incontriescort.org",
              role: "utenti"
            },
            {
              id: 5,
              name: "Contatto per problemi non risolti o lamentele",
              languages: ["Italian", "English"],
              email: "support@incontriescort.org",
              role: "supporto",
              notes: "(Si prega di contattare il supporto SOLO se il suo problema NON è stato risolto dall'Admin o dal suo agente di vendita)"
            }
          ]
        }
      ]
    });
  }
}
