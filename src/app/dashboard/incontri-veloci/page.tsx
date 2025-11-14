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

interface QuickMeetingProduct {
  id: number;
  code: string;
  label: string;
  type: "DAY" | "NIGHT" | string;
  quantityPerWindow: number;
  durationDays: number;
  creditsCost: number;
}

const CATEGORIES = {
  DONNA_CERCA_UOMO: "Donna cerca Uomo",
  TRANS: "Trans",
  UOMO_CERCA_UOMO: "Uomo cerca Uomo",
  CENTRO_MASSAGGI: "Centro Massaggi"
};

export default function IncontriVelociDashboard() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<QuickMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState<string>('DONNA_CERCA_UOMO');
  const [city, setCity] = useState<string>('Milano');
  const [limit, setLimit] = useState<number>(20);
  const [promoMeeting, setPromoMeeting] = useState<QuickMeeting | null>(null);
  const [packages, setPackages] = useState<QuickMeetingProduct[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [purchaseLoadingCode, setPurchaseLoadingCode] = useState<string | null>(null);
  const [bumpLoading, setBumpLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);

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

  const openPromo = async (meeting: QuickMeeting) => {
    setPromoMeeting(meeting);
    setPromoError(null);
    setPromoSuccess(null);
    setLoadingPackages(true);
    try {
      const res = await fetch('/api/quick-meetings/packages');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setPromoError(data.error || 'Impossibile caricare i pacchetti');
        setPackages([]);
        return;
      }
      const data = await res.json();
      setPackages(data.items || []);
    } catch (e) {
      console.error('Errore caricamento pacchetti', e);
      setPromoError('Errore durante il caricamento dei pacchetti');
    } finally {
      setLoadingPackages(false);
    }
  };

  const closePromo = () => {
    setPromoMeeting(null);
    setPackages([]);
    setPromoError(null);
    setPromoSuccess(null);
    setPurchaseLoadingCode(null);
    setBumpLoading(false);
  };

  const handlePurchase = async (code: string) => {
    if (!promoMeeting) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') || '' : '';
    if (!token) {
      alert('Devi effettuare il login per acquistare un pacchetto');
      return;
    }
    setPromoError(null);
    setPromoSuccess(null);
    setPurchaseLoadingCode(code);
    try {
      const res = await fetch('/api/quick-meetings/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ meetingId: promoMeeting.id, code })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPromoError(data.error || 'Impossibile completare l\'acquisto');
        return;
      }
      setPromoSuccess('Pacchetto acquistato con successo');
    } catch (e) {
      console.error('Errore acquisto pacchetto', e);
      setPromoError('Errore durante l\'acquisto del pacchetto');
    } finally {
      setPurchaseLoadingCode(null);
    }
  };

  const handleBumpNow = async () => {
    if (!promoMeeting) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') || '' : '';
    if (!token) {
      alert('Devi effettuare il login per utilizzare la risalita');
      return;
    }
    setPromoError(null);
    setPromoSuccess(null);
    setBumpLoading(true);
    try {
      const res = await fetch('/api/quick-meetings/bump-now', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ meetingId: promoMeeting.id })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPromoError(data.error || 'Nessuna risalita disponibile');
        return;
      }
      setPromoSuccess('Risalita eseguita con successo');
    } catch (e) {
      console.error('Errore bump-now', e);
      setPromoError('Errore durante la risalita');
    } finally {
      setBumpLoading(false);
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
        <p className="text-gray-400">Gestisci i tuoi annunci per incontri veloci</p>
      </div>

      {/* Bottoni Azioni */}
      <div className="mb-6 flex flex-wrap gap-3 items-center">
        <button
          onClick={() => router.push('/dashboard/incontri-veloci/nuovo')}
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
            onClick={() => router.push('/dashboard/incontri-veloci/nuovo')}
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
                      onClick={() => router.push(`/dashboard/incontri-veloci/${meeting.id}`)}
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
                      onClick={() => openPromo(meeting)}
                      className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-sm rounded transition-colors"
                    >
                      🚀 Promuovi
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
      {promoMeeting && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-3xl w-full mx-4 p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Promuovi Incontro Veloce</h2>
                <p className="text-gray-400 text-sm">Annuncio: <span className="text-pink-400 font-semibold">{promoMeeting.title}</span></p>
              </div>
              <button
                onClick={closePromo}
                className="text-gray-400 hover:text-gray-200 text-xl"
              >
                ✕
              </button>
            </div>

            {promoError && (
              <div className="mb-3 text-sm text-red-400 bg-red-900/30 border border-red-700 rounded px-3 py-2">
                {promoError}
              </div>
            )}
            {promoSuccess && (
              <div className="mb-3 text-sm text-emerald-300 bg-emerald-900/30 border border-emerald-700 rounded px-3 py-2">
                {promoSuccess}
              </div>
            )}

            {loadingPackages ? (
              <div className="py-10 text-center text-gray-400">Caricamento pacchetti...</div>
            ) : packages.length === 0 ? (
              <div className="py-10 text-center text-gray-400">Nessun pacchetto disponibile al momento.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {packages.map((p) => (
                  <div
                    key={p.id}
                    className={`rounded-xl border ${p.type === 'DAY' ? 'border-amber-500/60 bg-amber-900/20' : 'border-indigo-500/60 bg-indigo-900/20'} p-4 flex flex-col justify-between`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-white">{p.label}</h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-black/40 text-gray-200">
                          {p.type === 'DAY' ? 'Giorno' : 'Notte'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-300 mb-2">
                        {p.type === 'DAY' ? (
                          <span>1 risalita automatica al giorno per {p.durationDays} {p.durationDays === 1 ? 'giorno' : 'giorni'}.</span>
                        ) : (
                          <span>{p.quantityPerWindow} risalite a notte per {p.durationDays} {p.durationDays === 1 ? 'notte' : 'notti'}.</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        Finestra oraria: {p.type === 'DAY' ? '08:00 - 22:00' : '22:00 - 06:00'}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-lg font-bold text-pink-300">{p.creditsCost} crediti</div>
                      <button
                        onClick={() => handlePurchase(p.code)}
                        disabled={purchaseLoadingCode === p.code}
                        className="px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
                      >
                        {purchaseLoadingCode === p.code ? 'Acquisto in corso...' : 'Acquista'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between mt-2">
              <button
                onClick={handleBumpNow}
                disabled={bumpLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
              >
                {bumpLoading ? 'Risalita in corso...' : 'Risalita immediata adesso'}
              </button>
              <button
                onClick={closePromo}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
