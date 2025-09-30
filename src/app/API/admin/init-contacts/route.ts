import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultContacts = [
  {
    name: 'Francesco',
    email: 'francesco@incontriescort.org',
    phone: '+41 32 580 08 93',
    whatsapp: '+41 762031758',
    languages: ['Italian', 'English', 'Hungarian'],
    sectionKey: 'annunci',
    sectionTitle: 'Contatti per annunci'
  },
  {
    name: 'Marco',
    email: 'marco@incontriescort.org',
    languages: ['English'],
    sectionKey: 'annunci',
    sectionTitle: 'Contatti per annunci'
  },
  {
    name: 'Contatto per forum',
    email: 'forum@incontriescort.org',
    languages: ['Italian', 'English'],
    role: 'forum',
    sectionKey: 'altri-problemi',
    sectionTitle: 'Contattare per altri problemi'
  },
  {
    name: 'Contatti per utenti, recensioni, commenti e altro',
    email: 'info@incontriescort.org',
    languages: ['Italian', 'English'],
    role: 'utenti',
    sectionKey: 'altri-problemi',
    sectionTitle: 'Contattare per altri problemi'
  },
  {
    name: 'Contatto per problemi non risolti o lamentele',
    email: 'support@incontriescort.org',
    languages: ['Italian', 'English'],
    role: 'supporto',
    notes: "(Si prega di contattare il supporto SOLO se il suo problema NON è stato risolto dall'Admin o dal suo agente di vendita)",
    sectionKey: 'altri-problemi',
    sectionTitle: 'Contattare per altri problemi'
  }
];

// POST - Inizializza i contatti di default (solo se la tabella è vuota)
export async function POST() {
  try {
    // Verifica se ci sono già contatti
    const existingCount = await prisma.siteContact.count();
    
    if (existingCount > 0) {
      return NextResponse.json({ 
        message: `Tabella già inizializzata con ${existingCount} contatti`,
        skipped: true 
      });
    }

    console.log('🚀 Inizializzazione contatti di default...');

    // Inserisci i contatti di default
    const created = await prisma.siteContact.createMany({
      data: defaultContacts
    });

    console.log(`✅ Creati ${created.count} contatti di default`);

    return NextResponse.json({ 
      success: true, 
      created: created.count,
      message: `Inizializzati ${created.count} contatti di default`
    });
  } catch (error) {
    console.error('❌ ERRORE in POST /api/admin/init-contacts:', error);
    return NextResponse.json({ 
      error: 'Errore durante inizializzazione contatti',
      details: error instanceof Error ? error.message : 'Errore sconosciuto'
    }, { status: 500 });
  }
}
