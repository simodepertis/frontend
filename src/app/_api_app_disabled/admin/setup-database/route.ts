import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST - Crea la tabella SiteContact e inizializza i dati se non esistono
export async function POST() {
  try {
    console.log('🚀 Inizializzazione database contatti...');

    // Prova a creare la tabella (se non esiste)
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "SiteContact" (
        "id" SERIAL NOT NULL,
        "name" TEXT NOT NULL,
        "email" TEXT,
        "phone" TEXT,
        "whatsapp" TEXT,
        "telegram" TEXT,
        "languages" TEXT[],
        "role" TEXT,
        "notes" TEXT,
        "sectionKey" TEXT NOT NULL,
        "sectionTitle" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SiteContact_pkey" PRIMARY KEY ("id")
      );
    `;

    // Crea l'indice se non esiste
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "SiteContact_sectionKey_idx" ON "SiteContact"("sectionKey");
    `;

    console.log('✅ Tabella SiteContact creata/verificata');

    // Verifica se ci sono già contatti
    const existingCount = await prisma.siteContact.count();
    
    if (existingCount === 0) {
      console.log('📝 Inserimento contatti di default...');
      
      // Inserisci i contatti di default
      await prisma.siteContact.createMany({
        data: [
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
        ]
      });

      console.log('✅ Contatti di default inseriti');
    }

    // Conta i contatti finali
    const finalCount = await prisma.siteContact.count();

    return NextResponse.json({
      success: true,
      message: `Database inizializzato con successo. Contatti totali: ${finalCount}`,
      contactsCount: finalCount,
      wasEmpty: existingCount === 0
    });

  } catch (error) {
    console.error('❌ ERRORE setup database:', error);
    return NextResponse.json({
      error: 'Errore durante setup database',
      details: error instanceof Error ? error.message : 'Errore sconosciuto'
    }, { status: 500 });
  }
}

// GET - Verifica stato del database
export async function GET() {
  try {
    const count = await prisma.siteContact.count();
    const contacts = await prisma.siteContact.findMany({
      select: {
        id: true,
        name: true,
        sectionKey: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return NextResponse.json({
      status: 'ok',
      contactsCount: count,
      recentContacts: contacts,
      databaseConnected: true
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      databaseConnected: false,
      error: error instanceof Error ? error.message : 'Errore database'
    }, { status: 500 });
  }
}
