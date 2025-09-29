"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

type ContactItem = {
  id?: number;
  name: string;
  languages: string[];
  email?: string;
  phone?: string;
  whatsapp?: string;
  role?: string;
  notes?: string;
};

type ContactSection = {
  key: string;
  title: string;
  items: ContactItem[];
};

export default function AdminContattiPage() {
  const [contacts, setContacts] = useState<ContactSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ContactItem | null>(null);
  const [editingSection, setEditingSection] = useState<string>("");
  const [creatingSection, setCreatingSection] = useState<string>("annunci");
  const [creating, setCreating] = useState<ContactItem>({ name: "", languages: [] });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/admin/contacts', { cache: 'no-store' });
      const data = await response.json();
      setContacts(data.sections || []);
    } catch (error) {
      console.error('Errore nel caricamento contatti:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: ContactItem, sectionKey: string) => {
    setEditing(item);
    setEditingSection(sectionKey);
  };

  const handleSave = async () => {
    if (!editing || !editingSection || !editing.name) return;
    await fetch('/api/admin/contacts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editing.id, sectionKey: editingSection, item: editing })
    });
    setEditing(null);
    setEditingSection("");
    await fetchContacts();
  };

  const handleCancel = () => {
    setEditing(null);
    setEditingSection("");
  };

  const handleCreate = async () => {
    if (!creating.name) return;
    await fetch('/api/admin/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sectionKey: creatingSection, item: creating })
    });
    setCreating({ name: "", languages: [] });
    await fetchContacts();
  };

  const handleDelete = async (id?: number, sectionKey?: string) => {
    if (!id || !sectionKey) return;
    await fetch(`/api/admin/contacts?id=${id}&sectionKey=${encodeURIComponent(sectionKey)}`, {
      method: 'DELETE'
    });
    await fetchContacts();
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
      
      <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-400 mb-2">ℹ️ Informazioni</h2>
        <p className="text-gray-300 text-sm">
          Questa è una versione semplificata per permettere al cliente di vedere i contatti attuali. 
          Le modifiche vengono salvate nel file <code>src/config/siteContacts.json</code> senza usare il database.
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
              onChange={(e)=>setCreatingSection(e.target.value)}
            >
              <option value="annunci">Contatti per annunci</option>
              <option value="altri-problemi">Altri problemi</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nome</label>
            <input className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white" value={creating.name} onChange={(e)=>setCreating({...creating, name:e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white" value={creating.email||""} onChange={(e)=>setCreating({...creating, email:e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Telefono</label>
            <input className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white" value={creating.phone||""} onChange={(e)=>setCreating({...creating, phone:e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">WhatsApp</label>
            <input className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white" value={creating.whatsapp||""} onChange={(e)=>setCreating({...creating, whatsapp:e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Lingue (separate da virgola)</label>
            <input className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white" value={(creating.languages||[]).join(", ")} onChange={(e)=>setCreating({...creating, languages:e.target.value.split(",").map(s=>s.trim()).filter(Boolean)})} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1">Note</label>
            <textarea className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white" rows={2} value={creating.notes||""} onChange={(e)=>setCreating({...creating, notes:e.target.value})} />
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={handleCreate} className="bg-green-600 hover:bg-green-700">Aggiungi</Button>
        </div>
      </div>

      {contacts.map((section) => (
        <div key={section.key} className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">{section.title}</h2>
          
          <div className="space-y-4">
            {section.items.map((item, idx) => (
              <div key={idx} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                {editing && editing === item ? (
                  // Modalità modifica
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Nome</label>
                      <input
                        type="text"
                        value={editing.name}
                        onChange={(e) => setEditing({...editing, name: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                      <input
                        type="email"
                        value={editing.email || ""}
                        onChange={(e) => setEditing({...editing, email: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Telefono</label>
                      <input
                        type="text"
                        value={editing.phone || ""}
                        onChange={(e) => setEditing({...editing, phone: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">WhatsApp</label>
                      <input
                        type="text"
                        value={editing.whatsapp || ""}
                        onChange={(e) => setEditing({...editing, whatsapp: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Lingue (separate da virgola)</label>
                      <input
                        type="text"
                        value={editing.languages.join(", ")}
                        onChange={(e) => setEditing({...editing, languages: e.target.value.split(", ")})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Note</label>
                      <textarea
                        value={editing.notes || ""}
                        onChange={(e) => setEditing({...editing, notes: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                        Salva
                      </Button>
                      <Button onClick={handleCancel} variant="outline">
                        Annulla
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Modalità visualizzazione
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                      <div className="text-sm text-gray-300 mt-1">
                        <p>Lingue: {item.languages.join(", ")}</p>
                        {item.email && <p>Email: {item.email}</p>}
                        {item.phone && <p>Telefono: {item.phone}</p>}
                        {item.whatsapp && <p>WhatsApp: {item.whatsapp}</p>}
                        {item.notes && <p>Note: {item.notes}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleEdit(item, section.key)}
                        variant="outline"
                        size="sm"
                      >
                        Modifica
                      </Button>
                      <Button 
                        onClick={() => handleDelete(item.id, section.key)}
                        variant="destructive"
                        size="sm"
                        className="bg-red-600 hover:bg-red-700"
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
  );
}
