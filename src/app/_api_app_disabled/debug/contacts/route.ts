import { NextResponse } from 'next/server';
import { readContacts } from '@/lib/contactsStorage';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const isRender = process.env.RENDER || process.env.RENDER_INTERNAL_HOSTNAME;
    
    // Percorsi possibili
    const paths = {
      local: path.join(process.cwd(), 'src', 'config', 'siteContacts.json'),
      renderPersistent: '/var/data/siteContacts.json',
      renderTemp: '/tmp/siteContacts.json'
    };

    // Verifica accesso ai percorsi
    const pathStatus: any = {};
    for (const [name, filePath] of Object.entries(paths)) {
      try {
        await fs.access(filePath);
        const stats = await fs.stat(filePath);
        pathStatus[name] = {
          exists: true,
          path: filePath,
          size: stats.size,
          modified: stats.mtime
        };
      } catch {
        pathStatus[name] = {
          exists: false,
          path: filePath
        };
      }
    }

    // Verifica directory /var/data
    let varDataStatus = null;
    if (isRender) {
      try {
        await fs.access('/var/data', fs.constants.W_OK);
        varDataStatus = { accessible: true, writable: true };
      } catch (error: any) {
        varDataStatus = { accessible: false, error: error.message };
      }
    }

    // Leggi contatti attuali
    const contacts = await readContacts();

    return NextResponse.json({
      environment: {
        isRender: !!isRender,
        nodeEnv: process.env.NODE_ENV,
        renderEnv: process.env.RENDER,
        renderHostname: process.env.RENDER_INTERNAL_HOSTNAME
      },
      paths: pathStatus,
      varDataStatus,
      contacts: {
        sectionsCount: contacts.sections?.length || 0,
        totalContacts: contacts.sections?.reduce((sum, s) => sum + (s.items?.length || 0), 0) || 0,
        sections: contacts.sections?.map(s => ({
          key: s.key,
          title: s.title,
          itemsCount: s.items?.length || 0
        }))
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
