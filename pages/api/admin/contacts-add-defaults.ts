import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Idempotente: aggiunge 3 card predefinite nella sezione "altri-problemi" solo se mancano
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const sectionKey = 'altri-problemi';
    const defaults = [
      {
        name: 'Contatto per forum',
        email: 'forum@incontriescort.org',
        role: 'forum',
        languages: ['Italian', 'English'] as string[],
        notes: null as string | null
      },
      {
        name: 'Contatti per utenti, recensioni, commenti e altro',
        email: 'info@incontriescort.org',
        role: 'utenti',
        languages: ['Italian', 'English'] as string[],
        notes: null as string | null
      },
      {
        name: 'Contatto per problemi non risolti o lamentele',
        email: 'support@incontriescort.org',
        role: 'supporto',
        languages: ['Italian', 'English'] as string[],
        notes: '(Si prega di contattare il supporto SOLO se il suo problema NON è stato risolto dall\'Admin o dal suo agente di vendita)'
      }
    ];

    const created: any[] = [];
    for (const d of defaults) {
      const exists = await prisma.siteContact.findFirst({
        where: {
          sectionKey,
          name: d.name,
          email: d.email,
        }
      });

      if (!exists) {
        const item = await prisma.siteContact.create({
          data: {
            name: d.name,
            email: d.email,
            phone: null,
            whatsapp: null,
            telegram: null,
            languages: d.languages,
            role: d.role,
            notes: d.notes,
            sectionKey,
            sectionTitle: 'Contattare per altri problemi'
          }
        });
        created.push(item);
      }
    }

    return res.status(200).json({ success: true, createdCount: created.length, created });
  } catch (error) {
    console.error('contacts-add-defaults error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
