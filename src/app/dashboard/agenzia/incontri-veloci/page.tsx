"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface QuickMeeting {
  id: number;
  title: string;
  category: string;
  city: string;
  zone?: string;
  phone?: string;
  age?: number;
  photos: string[];
  publishedAt: string;
  isActive: boolean;
}

const CATEGORIES = {
  DONNA_CERCA_UOMO: "Donna cerca Uomo",
  TRANS: "Trans",
  UOMO_CERCA_UOMO: "Uomo cerca Uomo",
  CENTRO_MASSAGGI: "Centro Massaggi"
};

export default function IncontriVelociAgenzia() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<QuickMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState<string>('DONNA_CERCA_UOMO');
  const [city, setCity] = useState<string>('Milano');
  const [limit, setLimit] = useState<number>(20);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      const res = await fetch('/api/dashboard/quick-meetings');
      if (res.ok) {
        const data = await res.json();
        setMeetings(data.meetings);
      }
    } catch (error) {
      console.error('Errore caricamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo annuncio?')) return;

    try {
      const res = await fetch(`/api/dashboard/quick-meetings/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setMeetings(meetings.filter(m => m.id !== id));
        alert('Annuncio eliminato con successo');
      } else {
        alert('Errore durante l\'eliminazione');
      }
    } catch (error) {
      console.error('Errore:', error);
      alert('Errore durante l\'eliminazione');
    }
  };

  const toggleActive = async (id: number, isActive: boolean) => {
    try {
      const res = await fetch(`/api/dashboard/quick-meetings/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      });

      if (res.ok) {
        setMeetings(meetings.map(m => 
          m.id === id ? { ...m, isActive: !isActive } : m
        ));
      }
    } catch (error) {
      console.error('Errore:', error);
    }
  };

  const handleBulkImport = async () => {
    try {
      const cat = prompt(
        'Categoria (DONNA_CERCA_UOMO | TRANS | UOMO_CERCA_UOMO | CENTRO_MASSAGGI):',
        'DONNA_CERCA_UOMO'
      );
      if (!cat) return;
      const city = prompt('Città (es. Milano):', 'Milano') || 'Milano';
      const limitStr = prompt('Quanti annunci importare? (es. 20):', '20') || '20';
      const limit = Math.max(1, Math.min(200, parseInt(limitStr, 10) || 20));

      const res = await fetch('/api/dashboard/quick-meetings/import-manuale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: cat, city, limit })
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        alert(`Errore importazione: ${e.error || res.statusText}`);
        return;
      }
      const data = await res.json();
      alert(`✅ Importazione completata\nImportati: ${data.imported}\nSaltati: ${data.skipped}`);
      loadMeetings();
    } catch (err) {
      console.error('Import error', err);
      alert('Errore durante l\'importazione');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-gray-400">Caricamento...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">I Miei Incontri Veloci</h1>
        <p className="text-gray-400">Gestisci gli annunci per incontri veloci della tua agenzia</p>
      </div>

      {/* Bottoni Azioni */}
      <div className="mb-6 flex flex-wrap gap-3 items-center">
        <button
          onClick={() => router.push('/dashboard/agenzia/incontri-veloci/nuovo')}
          className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          Crea Nuovo Annuncio
        </button>
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white"
        >
          <option value="DONNA_CERCA_UOMO">Donna cerca Uomo</option>
          <option value="TRANS">Trans</option>
          <option value="UOMO_CERCA_UOMO">Uomo cerca Uomo</option>
          <option value="CENTRO_MASSAGGI">Centro Massaggi</option>
        </select>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Città"
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white w-40"
        />
        <input
          type="number"
          value={limit}
          onChange={(e) => setLimit(Math.max(1, Math.min(200, parseInt(e.target.value || '1', 10))))}
          placeholder="Limite"
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white w-24"
        />
        <button
          onClick={handleBulkImport}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
        >
          <span>📥</span>
          Carica annunci
        </button>
      </div>

      {/* Lista Annunci */}
      {meetings.length === 0 ? (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
          <div className="text-gray-400 mb-4">
            Non hai ancora creato annunci per Incontri Veloci
          </div>
          <button
            onClick={() => router.push('/dashboard/agenzia/incontri-veloci/nuovo')}
            className="text-pink-400 hover:text-pink-300 font-medium"
          >
            Crea il tuo primo annuncio →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-gray-600 transition-colors"
            >
              <div className="flex gap-4">
                {/* Foto */}
                <div className="w-32 h-32 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                  {meeting.photos[0] ? (
                    <img
                      src={meeting.photos[0]}
                      alt={meeting.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      📷
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{meeting.title}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        <span className="px-2 py-1 bg-gray-700 rounded text-xs">
                          {CATEGORIES[meeting.category as keyof typeof CATEGORIES]}
                        </span>
                        <span>📍 {meeting.city}</span>
                        {meeting.zone && <span>🏘️ {meeting.zone}</span>}
                        {meeting.age && <span>🎂 {meeting.age} anni</span>}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        meeting.isActive 
                          ? 'bg-green-900 text-green-200' 
                          : 'bg-gray-700 text-gray-400'
                      }`}>
                        {meeting.isActive ? '✓ Attivo' : '○ Disattivato'}
                      </span>
                    </div>
                  </div>

                  {/* Contatti */}
                  <div className="mb-4 text-sm text-gray-400">
                    {meeting.phone && <span>📞 {meeting.phone}</span>}
                  </div>

                  {/* Azioni */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => router.push(`/dashboard/agenzia/incontri-veloci/${meeting.id}`)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                    >
                      ✏️ Modifica
                    </button>
                    
                    <button
                      onClick={() => toggleActive(meeting.id, meeting.isActive)}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                    >
                      {meeting.isActive ? '📝 Metti bozza' : '✅ Pubblica'}
                    </button>

                    <button
                      onClick={() => window.open(`/incontri-veloci/${meeting.id}`, '_blank')}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                    >
                      👁️ Anteprima
                    </button>
                    
                    <button
                      onClick={() => handleDelete(meeting.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors ml-auto"
                    >
                      🗑️ Elimina
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
