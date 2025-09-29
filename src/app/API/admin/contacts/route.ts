import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Per ora ritorna i contatti hardcoded finché non facciamo la migration del database
const defaultContacts = {
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
          role: "forum",
          notes: ""
        },
        {
          id: 4,
          name: "Contatti per utenti, recensioni, commenti e altro",
          languages: ["Italian", "English"],
          email: "info@incontriescort.org",
          role: "utenti",
          notes: ""
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
};

// GET - Recupera tutti i contatti
export async function GET() {
  try {
    // Per ora ritorna i contatti di default
    // TODO: Implementare database dopo migration
    return NextResponse.json(defaultContacts);
  } catch (error) {
    console.error('❌ ERRORE in GET /api/admin/contacts:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero dei contatti' },
      { status: 500 }
    );
  }
}

// TODO: Implementare POST, PUT, DELETE dopo migration database
