import { promises as fs } from 'fs';
import path from 'path';

export type ContactItem = {
  id?: number;
  name: string;
  languages?: string[];
  email?: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  role?: string;
  notes?: string;
};

export type ContactSection = {
  key: string;
  title: string;
  items: ContactItem[];
};

export type ContactsFile = { sections: ContactSection[] };

const defaultContacts: ContactsFile = {
  sections: [
    {
      key: 'annunci',
      title: 'Contatti per annunci',
      items: [
        {
          name: 'Francesco',
          languages: ['Italian', 'English', 'Hungarian'],
          phone: '+41 32 580 08 93',
          email: 'francesco@incontriescort.org',
          whatsapp: '+41 762031758',
        },
        {
          name: 'Marco',
          languages: ['English'],
          email: 'marco@incontriescort.org',
        },
      ],
    },
    {
      key: 'altri-problemi',
      title: 'Contattare per altri problemi',
      items: [
        {
          name: 'Contatto per forum',
          languages: ['Italian', 'English'],
          email: 'forum@incontriescort.org',
          role: 'forum',
          notes: '',
        },
        {
          name: 'Contatti per utenti, recensioni, commenti e altro',
          languages: ['Italian', 'English'],
          email: 'info@incontriescort.org',
          role: 'utenti',
          notes: '',
        },
        {
          name: 'Contatto per problemi non risolti o lamentele',
          languages: ['Italian', 'English'],
          email: 'support@incontriescort.org',
          role: 'supporto',
          notes:
            "(Si prega di contattare il supporto SOLO se il suo problema NON è stato risolto dall'Admin o dal suo agente di vendita)",
        },
      ],
    },
  ],
};

function isRender() {
  return process.env.RENDER || process.env.RENDER_INTERNAL_HOSTNAME;
}

function storagePath(): string {
  if (isRender()) {
    // Su Render, prova prima /var/data, poi fallback a /tmp
    const renderPath = '/var/data/siteContacts.json';
    const fallbackPath = '/tmp/siteContacts.json';
    try {
      // Verifica se /var/data esiste
      require('fs').accessSync('/var/data', require('fs').constants.W_OK);
      return renderPath;
    } catch {
      console.log('⚠️ /var/data non accessibile, uso /tmp come fallback');
      return fallbackPath;
    }
  }
  return path.join(process.cwd(), 'src', 'config', 'siteContacts.json');
}

export async function ensureFileExists(): Promise<void> {
  const file = storagePath();
  try {
    await fs.access(file);
  } catch {
    // Try to seed from local config if present
    try {
      const local = path.join(process.cwd(), 'src', 'config', 'siteContacts.json');
      const raw = await fs.readFile(local, 'utf8');
      await atomicWrite(file, raw);
      return;
    } catch {
      await atomicWrite(file, JSON.stringify(defaultContacts, null, 2));
    }
  }
}

export async function readContacts(): Promise<ContactsFile> {
  const file = storagePath();
  console.log(`📖 Lettura contatti da: ${file}`);
  try {
    await ensureFileExists();
    const raw = await fs.readFile(file, 'utf8');
    const data = JSON.parse(raw);
    console.log(`✅ Contatti letti: ${data.sections?.length || 0} sezioni`);
    return data;
  } catch (error) {
    console.log(`⚠️ Errore lettura contatti, uso default:`, error);
    return defaultContacts;
  }
}

export async function writeContacts(data: ContactsFile): Promise<void> {
  const file = storagePath();
  console.log(`💾 Scrittura contatti su: ${file}`);
  try {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await atomicWrite(file, JSON.stringify(data, null, 2));
    console.log(`✅ Contatti salvati: ${data.sections?.length || 0} sezioni`);
  } catch (error) {
    console.error(`❌ Errore scrittura contatti:`, error);
    throw error;
  }
}

async function atomicWrite(targetPath: string, content: string): Promise<void> {
  const dir = path.dirname(targetPath);
  const tmp = path.join(dir, `.tmp-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  await fs.writeFile(tmp, content, 'utf8');
  await fs.rename(tmp, targetPath);
}
