"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  getContacts, 
  setContacts, 
  addContact, 
  updateContact, 
  deleteContact,
  type ContactItem, 
  type ContactSection 
} from "@/lib/contactsLocalStorage";

export default function AdminContattiFinalPage() {
  const [contacts, setContactsState] = useState<ContactSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ContactItem | null>(null);
  const [editingSection, setEditingSection] = useState<string>("");
  const [creatingSection, setCreatingSection] = useState<string>("annunci");
  const [creating, setCreating] = useState<ContactItem>({ name: "", languages: [] });

  useEffect(() => {
    // Carica i contatti dal localStorage
    const data = getContacts();
    setContactsState(data.sections);
    setLoading(false);
  }, []);

  const refreshContacts = () => {
    const data = getContacts();
    setContactsState(data.sections);
  };

  const handleEdit = (item: ContactItem, sectionKey: string) => {
    setEditing(item);
    setEditingSection(sectionKey);
  };

  const handleSave = () => {
    if (!editing || !editingSection || !editing.name) return;
    
    const updated = updateContact(editing.id!, editingSection, editing);
    if (updated) {
      setEditing(null);
      setEditingSection("");
      refreshContacts();
      alert('Contatto modificato con successo!');
    } else {
      alert('Errore durante modifica contatto');
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setEditingSection("");
  };

  const handleCreate = () => {
    if (!creating.name) return;
    
    const newContact = addContact(creatingSection, getSectionTitle(creatingSection), creating);
    setCreating({ name: "", languages: [] });
    refreshContacts();
    alert('Contatto aggiunto con successo!');
  };

  const handleDelete = (id?: number, sectionKey?: string) => {
    if (!id || !sectionKey) return;
    if (!confirm('Sei sicuro di voler eliminare questo contatto?')) return;
    
    const deleted = deleteContact(id, sectionKey);
    if (deleted) {
      refreshContacts();
      alert('Contatto eliminato con successo!');
    } else {
      alert('Errore durante eliminazione contatto');
    }
  };

  const getSectionTitle = (key: string) => {
    switch (key) {
      case 'annunci': return 'Contatti per annunci';
      case 'altri-problemi': return 'Contattare per altri problemi';
      default: return key;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-white">Gestione Contatti</h1>
        <div className="text-white">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-white">Gestione Contatti</h1>
      
      <div className="mb-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
        <h2 className="text-lg font-semibold text-green-400 mb-2">✅ Sistema LocalStorage</h2>
        <p className="text-gray-300 text-sm">
          I contatti vengono salvati nel browser (localStorage). Funziona sempre e i dati persistono.
          <br />
          <strong>Vantaggi:</strong> Sincronizzazione immediata, nessuna dipendenza da server.
        </p>
      </div>

      {/* Crea nuovo contatto */}
      <div className="mb-8 p-4 bg-gray-800 border border-gray-700 rounded-lg">
        <h2 className="text-xl font-semibold text-white mb-4">Aggiungi contatto</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Sezione</label>
            <select
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              value={creatingSection}
              onChange={(e) => setCreatingSection(e.target.value)}
            >
              <option value="annunci">Contatti per annunci</option>
              <option value="altri-problemi">Contattare per altri problemi</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nome</label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              value={creating.name}
              onChange={(e) => setCreating({ ...creating, name: e.target.value })}
              placeholder="Nome del contatto"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              type="email"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              value={creating.email || ''}
              onChange={(e) => setCreating({ ...creating, email: e.target.value })}
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Telefono</label>
            <input
              type="tel"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              value={creating.phone || ''}
              onChange={(e) => setCreating({ ...creating, phone: e.target.value })}
              placeholder="+39 123 456 7890"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">WhatsApp</label>
            <input
              type="tel"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              value={creating.whatsapp || ''}
              onChange={(e) => setCreating({ ...creating, whatsapp: e.target.value })}
              placeholder="+39 123 456 7890"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Lingue (separate da virgola)</label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              value={creating.languages?.join(', ') || ''}
              onChange={(e) => setCreating({ 
                ...creating, 
                languages: e.target.value.split(',').map(l => l.trim()).filter(l => l) 
              })}
              placeholder="Italian, English"
            />
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
            Aggiungi
          </Button>
        </div>
      </div>

      {/* Lista contatti esistenti */}
      <div className="space-y-6">
        {contacts.map((section) => (
          <div key={section.key} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">{section.title}</h3>
            <div className="space-y-3">
              {section.items.map((item) => (
                <div key={item.id} className="bg-gray-700 p-3 rounded-md">
                  {editing?.id === item.id ? (
                    // Modalità modifica
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                        value={editing.name}
                        onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                        placeholder="Nome"
                      />
                      <input
                        type="email"
                        className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                        value={editing.email || ''}
                        onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                        placeholder="Email"
                      />
                      <input
                        type="tel"
                        className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                        value={editing.phone || ''}
                        onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                        placeholder="Telefono"
                      />
                      <input
                        type="tel"
                        className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                        value={editing.whatsapp || ''}
                        onChange={(e) => setEditing({ ...editing, whatsapp: e.target.value })}
                        placeholder="WhatsApp"
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleSave} size="sm" className="bg-green-600 hover:bg-green-700">
                          Salva
                        </Button>
                        <Button onClick={handleCancel} size="sm" variant="outline">
                          Annulla
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Modalità visualizzazione
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-white font-medium">{item.name}</div>
                        {item.email && <div className="text-gray-300 text-sm">📧 {item.email}</div>}
                        {item.phone && <div className="text-gray-300 text-sm">📞 {item.phone}</div>}
                        {item.whatsapp && <div className="text-gray-300 text-sm">💬 {item.whatsapp}</div>}
                        {item.languages && item.languages.length > 0 && (
                          <div className="text-gray-400 text-sm">🌐 {item.languages.join(', ')}</div>
                        )}
                        {item.notes && <div className="text-gray-400 text-sm mt-1">{item.notes}</div>}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleEdit(item, section.key)} 
                          size="sm" 
                          variant="outline"
                        >
                          Modifica
                        </Button>
                        <Button 
                          onClick={() => handleDelete(item.id, section.key)} 
                          size="sm" 
                          variant="destructive"
                        >
                          Elimina
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
