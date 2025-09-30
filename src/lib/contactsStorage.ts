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
  return process.env.RENDER || process.env.RENDER_INTERNAL_HOSTNAME || process.env.NEXT_RUNTIME === 'edge' || process.env.NODE_ENV === 'production';
}

function storagePath(): string {
  if (isRender()) return '/var/data/siteContacts.json';
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
  try {
    await ensureFileExists();
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw);
  } catch {
    return defaultContacts;
  }
}

export async function writeContacts(data: ContactsFile): Promise<void> {
  const file = storagePath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await atomicWrite(file, JSON.stringify(data, null, 2));
}

async function atomicWrite(targetPath: string, content: string): Promise<void> {
  const dir = path.dirname(targetPath);
  const tmp = path.join(dir, `.tmp-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  await fs.writeFile(tmp, content, 'utf8');
  await fs.rename(tmp, targetPath);
}
