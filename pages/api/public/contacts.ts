import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const contacts = await prisma.siteContact.findMany({
      orderBy: [{ sectionKey: 'asc' }, { createdAt: 'asc' }]
    });

    const sectionsMap = new Map<string, any>();
    contacts.forEach((contact) => {
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
    return res.status(200).json({ sections });
  } catch (error) {
    console.error('GET /pages/api/public/contacts error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
