import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
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
    }

    if (req.method === 'POST') {
      const { sectionKey, sectionTitle, item } = req.body as { sectionKey: string; sectionTitle?: string; item: any };
      if (!sectionKey || !item || !item.name) return res.status(400).json({ error: 'Dati mancanti' });

      const newContact = await prisma.siteContact.create({
        data: {
          name: item.name,
          email: item.email || null,
          phone: item.phone || null,
          whatsapp: item.whatsapp || null,
          telegram: item.telegram || null,
          languages: item.languages || [],
          role: item.role || null,
          notes: item.notes || null,
          sectionKey,
          sectionTitle: sectionTitle || sectionKey
        }
      });

      return res.status(200).json({ success: true, item: newContact });
    }

    if (req.method === 'PUT') {
      const { id, item } = req.body as { id: number; sectionKey: string; item: any };
      if (!id) return res.status(400).json({ error: 'ID mancante' });

      const updated = await prisma.siteContact.update({
        where: { id },
        data: {
          name: item.name,
          email: item.email || null,
          phone: item.phone || null,
          whatsapp: item.whatsapp || null,
          telegram: item.telegram || null,
          languages: item.languages || [],
          role: item.role || null,
          notes: item.notes || null
        }
      });

      return res.status(200).json({ success: true, item: updated });
    }

    if (req.method === 'DELETE') {
      const id = Number((req.query.id as string) || '');
      if (!id) return res.status(400).json({ error: 'ID mancante' });

      await prisma.siteContact.delete({ where: { id } });
      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('pages/api/admin/contacts error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
