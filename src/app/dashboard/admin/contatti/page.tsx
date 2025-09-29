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

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/admin/contacts');
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
    // TODO: Implementare salvataggio dopo migration database
    alert('Funzione di salvataggio sarà implementata dopo la migration del database');
    setEditing(null);
    setEditingSection("");
  };

  const handleCancel = () => {
    setEditing(null);
    setEditingSection("");
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
          Le funzioni di modifica saranno implementate dopo la migration del database.
        </p>
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
                    <Button 
                      onClick={() => handleEdit(item, section.key)}
                      variant="outline"
                      size="sm"
                    >
                      Modifica
                    </Button>
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
