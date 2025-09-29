import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Recupera contatti pubblici per la pagina contatti
export async function GET() {
  try {
    const contacts = await prisma.siteContact.findMany({
      orderBy: [{ sectionKey: 'asc' }, { createdAt: 'asc' }]
    });

    // Raggruppa per sezione
    const sectionsMap = new Map<string, any>();
    
    contacts.forEach(contact => {
      if (!sectionsMap.has(contact.sectionKey)) {
        sectionsMap.set(contact.sectionKey, {
          key: contact.sectionKey,
          title: contact.sectionTitle,
          items: []
        });
      }
      
      sectionsMap.get(contact.sectionKey)!.items.push({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        whatsapp: contact.whatsapp,
        telegram: contact.telegram,
        languages: contact.languages,
        role: contact.role,
        notes: contact.notes
      });
    });

    const sections = Array.from(sectionsMap.values());
    return NextResponse.json({ sections });
  } catch (error) {
    console.error('❌ ERRORE in GET /api/public/contacts:', error);
    
    // Fallback ai contatti di default
    return NextResponse.json({
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
        }
      ]
    });
  }
}
