// Sistema di contatti che usa localStorage - FUNZIONA SEMPRE

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

export type ContactsData = {
  sections: ContactSection[];
};

const DEFAULT_CONTACTS: ContactsData = {
  sections: [
    {
      key: 'annunci',
      title: 'Contatti per annunci',
      items: [
        {
          id: 1,
          name: 'Francesco',
          email: 'francesco@incontriescort.org',
          phone: '+41 32 580 08 93',
          whatsapp: '+41 762031758',
          languages: ['Italian', 'English', 'Hungarian']
        },
        {
          id: 2,
          name: 'Marco',
          email: 'marco@incontriescort.org',
          languages: ['English']
        }
      ]
    },
    {
      key: 'altri-problemi',
      title: 'Contattare per altri problemi',
      items: [
        {
          id: 3,
          name: 'Contatto per forum',
          email: 'forum@incontriescort.org',
          languages: ['Italian', 'English'],
          role: 'forum'
        },
        {
          id: 4,
          name: 'Contatti per utenti, recensioni, commenti e altro',
          email: 'info@incontriescort.org',
          languages: ['Italian', 'English'],
          role: 'utenti'
        },
        {
          id: 5,
          name: 'Contatto per problemi non risolti o lamentele',
          email: 'support@incontriescort.org',
          languages: ['Italian', 'English'],
          role: 'supporto',
          notes: "(Si prega di contattare il supporto SOLO se il suo problema NON è stato risolto dall'Admin o dal suo agente di vendita)"
        }
      ]
    }
  ]
};

const STORAGE_KEY = 'site_contacts_data';

// Legge i contatti dal localStorage
export function getContacts(): ContactsData {
  if (typeof window === 'undefined') {
    return DEFAULT_CONTACTS; // Server-side
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      console.log('📖 Contatti caricati da localStorage:', data.sections?.length || 0, 'sezioni');
      return data;
    }
  } catch (error) {
    console.error('❌ Errore lettura localStorage:', error);
  }
  
  // Se non ci sono dati, inizializza con i default
  setContacts(DEFAULT_CONTACTS);
  return DEFAULT_CONTACTS;
}

// Salva i contatti nel localStorage
export function setContacts(data: ContactsData): void {
  if (typeof window === 'undefined') {
    return; // Server-side
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log('💾 Contatti salvati in localStorage:', data.sections?.length || 0, 'sezioni');
    
    // Trigger evento personalizzato per notificare altre pagine
    window.dispatchEvent(new CustomEvent('contactsUpdated', { detail: data }));
  } catch (error) {
    console.error('❌ Errore salvataggio localStorage:', error);
  }
}

// Aggiunge un contatto
export function addContact(sectionKey: string, sectionTitle: string, item: ContactItem): ContactItem {
  const data = getContacts();
  
  // Trova o crea la sezione
  let section = data.sections.find(s => s.key === sectionKey);
  if (!section) {
    section = { key: sectionKey, title: sectionTitle, items: [] };
    data.sections.push(section);
  }
  
  // Calcola nuovo ID
  const maxId = Math.max(0, ...data.sections.flatMap(s => s.items.map(i => i.id || 0)));
  const newContact = { ...item, id: maxId + 1 };
  
  section.items.push(newContact);
  setContacts(data);
  
  console.log('✅ Contatto aggiunto:', newContact);
  return newContact;
}

// Modifica un contatto
export function updateContact(id: number, sectionKey: string, updates: Partial<ContactItem>): ContactItem | null {
  const data = getContacts();
  
  const section = data.sections.find(s => s.key === sectionKey);
  if (!section) return null;
  
  const idx = section.items.findIndex(i => i.id === id);
  if (idx === -1) return null;
  
  section.items[idx] = { ...section.items[idx], ...updates, id };
  setContacts(data);
  
  console.log('✅ Contatto aggiornato:', section.items[idx]);
  return section.items[idx];
}

// Elimina un contatto
export function deleteContact(id: number, sectionKey: string): boolean {
  const data = getContacts();
  
  const section = data.sections.find(s => s.key === sectionKey);
  if (!section) return false;
  
  const before = section.items.length;
  section.items = section.items.filter(i => i.id !== id);
  
  if (section.items.length === before) return false;
  
  setContacts(data);
  
  console.log('✅ Contatto eliminato, ID:', id);
  return true;
}

// Hook per ascoltare cambiamenti
export function useContactsSync(callback: (data: ContactsData) => void): void {
  if (typeof window === 'undefined') return;
  
  const handleUpdate = (event: CustomEvent) => {
    callback(event.detail);
  };
  
  window.addEventListener('contactsUpdated', handleUpdate as EventListener);
  
  // Cleanup
  return () => {
    window.removeEventListener('contactsUpdated', handleUpdate as EventListener);
  };
}
