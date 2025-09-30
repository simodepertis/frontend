import { NextResponse } from 'next/server';

// GET - Recupera contatti per la pagina pubblica (legge dalla stessa fonte dell'admin)
export async function GET() {
  try {
    console.log('📞 Caricamento contatti pubblici...');
    
    // Chiama l'API admin per ottenere i contatti aggiornati
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.RENDER_EXTERNAL_URL
      ? process.env.RENDER_EXTERNAL_URL
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/admin/contacts-simple`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
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
