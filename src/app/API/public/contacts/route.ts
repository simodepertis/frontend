import { NextResponse } from 'next/server';

// GET - Recupera contatti pubblici per la pagina contatti
export async function GET() {
  try {
    // Per ora ritorna i contatti hardcoded
    // TODO: Implementare database dopo migration
    const contacts = {
      sections: [
        {
          key: "annunci",
          title: "Contatti per annunci",
          items: [
            {
              name: "Francesco",
              languages: ["Italian", "English", "Hungarian"],
              phone: "+41 32 580 08 93",
              email: "francesco@incontriescort.org",
              whatsapp: "+41 762031758"
            },
            {
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
              name: "Contatto per forum",
              languages: ["Italian", "English"],
              email: "forum@incontriescort.org",
              role: "forum",
              notes: ""
            },
            {
              name: "Contatti per utenti, recensioni, commenti e altro",
              languages: ["Italian", "English"],
              email: "info@incontriescort.org",
              role: "utenti",
              notes: ""
            },
            {
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
    
    return NextResponse.json(contacts);
  } catch (error) {
    console.error('❌ ERRORE in GET /api/public/contacts:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero dei contatti' },
      { status: 500 }
    );
  }
}
