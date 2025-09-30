"use client";

import { useState, useEffect } from "react";
import { getContacts, type ContactSection } from "@/lib/contactsLocalStorage";

// Funzioni helper per i link
function getPhoneLink(phone: string): string {
  return `tel:${phone}`;
}

function getEmailLink(email: string): string {
  return `mailto:${email}`;
}

function getWhatsAppLink(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}`;
}

function getTelegramLink(handle: string): string {
  const cleanHandle = handle.replace('@', '');
  return `https://t.me/${cleanHandle}`;
}

export default function ContattiFinalPage() {
  const [contactsData, setContactsData] = useState<{ sections: ContactSection[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContacts = () => {
      try {
        const data = getContacts();
        console.log('📞 Contatti caricati da localStorage:', data);
        setContactsData(data);
      } catch (error) {
        console.error('Errore nel caricamento contatti:', error);
        // Fallback ai contatti di default
        setContactsData({
          sections: [
            {
              key: "annunci",
              title: "Contatti per annunci",
              items: [
                {
                  id: 1,
                  name: "Francesco",
                  languages: ["Italian", "English", "Hungarian"],
                  phone: "+41 32 580 08 93",
                  email: "francesco@incontriescort.org",
                  whatsapp: "+41 762031758"
                },
                {
                  id: 2,
                  name: "Marco",
                  languages: ["English"],
                  email: "marco@incontriescort.org"
                }
              ]
            }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    loadContacts();

    // Ascolta gli aggiornamenti dal localStorage
    const handleStorageChange = () => {
      console.log('🔄 Rilevato cambiamento localStorage, ricarico contatti...');
      loadContacts();
    };

    // Ascolta eventi personalizzati
    const handleContactsUpdate = () => {
      console.log('🔄 Rilevato aggiornamento contatti, ricarico...');
      loadContacts();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('contactsUpdated', handleContactsUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('contactsUpdated', handleContactsUpdate);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-8 text-center">Contatti</h1>
          <div className="text-center">Caricamento...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center">Contatti</h1>
        
        <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <p className="text-blue-300 text-sm text-center">
            ✨ I contatti vengono caricati dal localStorage. Aggiornamenti in tempo reale!
          </p>
        </div>

        {contactsData?.sections.map((section) => (
          <div key={section.key} className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 text-blue-400">{section.title}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {section.items.map((contact) => (
                <div key={contact.id} className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:bg-gray-750 transition-colors">
                  <h3 className="text-xl font-semibold mb-3 text-white">{contact.name}</h3>
                  
                  {contact.languages && contact.languages.length > 0 && (
                    <div className="mb-3">
                      <span className="text-gray-400 text-sm">Lingue: </span>
                      <span className="text-gray-300 text-sm">{contact.languages.join(', ')}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    {contact.phone && (
                      <div>
                        <span className="text-gray-400 text-sm">Telefono: </span>
                        <a 
                          href={getPhoneLink(contact.phone)} 
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          {contact.phone}
                        </a>
                      </div>
                    )}

                    {contact.email && (
                      <div>
                        <span className="text-gray-400 text-sm">E-mail: </span>
                        <a 
                          href={getEmailLink(contact.email)} 
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          {contact.email}
                        </a>
                      </div>
                    )}

                    {contact.whatsapp && (
                      <div>
                        <span className="text-gray-400 text-sm">WhatsApp: </span>
                        <a 
                          href={getWhatsAppLink(contact.whatsapp)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-green-400 hover:text-green-300 text-sm"
                        >
                          {contact.whatsapp}
                        </a>
                      </div>
                    )}

                    {contact.telegram && (
                      <div>
                        <span className="text-gray-400 text-sm">Telegram: </span>
                        <a 
                          href={getTelegramLink(contact.telegram)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          {contact.telegram}
                        </a>
                      </div>
                    )}
                  </div>

                  {contact.notes && (
                    <div className="mt-4 p-3 bg-gray-700 rounded text-gray-300 text-sm">
                      {contact.notes}
                    </div>
                  )}

                  {/* Pulsanti di azione */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {contact.whatsapp && (
                      <a
                        href={getWhatsAppLink(contact.whatsapp)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Invia un messaggio
                      </a>
                    )}
                    {contact.email && (
                      <a
                        href={getEmailLink(contact.email)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Invia email
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {(!contactsData?.sections || contactsData.sections.length === 0) && (
          <div className="text-center text-gray-400 py-12">
            <p>Nessun contatto disponibile al momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
