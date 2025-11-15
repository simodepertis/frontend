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
  const [meetingHasPackage, setMeetingHasPackage] = useState<Record<number, boolean>>({});
  const [selectedPackage, setSelectedPackage] = useState<QuickMeetingProduct | null>(null);
  const [activePurchase, setActivePurchase] = useState<{
    id: number;
    productCode: string;
    productLabel: string;
    type: string;
    expiresAt: string;
    durationDays: number;
    startedAt: string;
  } | null>(null);
  const [daySlots, setDaySlots] = useState<{ date: string; slots: number[] }[]>([]);
  const [scheduleSummary, setScheduleSummary] = useState<{ runAt: string; window: string }[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      const res = await fetch('/api/dashboard/quick-meetings');
      if (res.ok) {
        const data = await res.json();
        setMeetings(data.meetings);

        // dopo aver caricato gli annunci, inizializza la mappa dei pacchetti attivi
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') || '' : '';
        if (token && Array.isArray(data.meetings) && data.meetings.length > 0) {
          try {
            const entries = await Promise.all(
              data.meetings.map(async (m: QuickMeeting) => {
                try {
                  const r = await fetch(`/api/quick-meetings/schedule?meetingId=${m.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  if (!r.ok) return [m.id, false] as const;
                  const d = await r.json();
                  return [m.id, !!d?.purchase] as const;
                } catch {
                  return [m.id, false] as const;
                }
              })
            );

            const map: Record<number, boolean> = {};
            for (const [id, has] of entries) {
              map[id] = has;
            }
            setMeetingHasPackage(map);
          } catch {
            // in caso di errore, lascia la mappa vuota
          }
        }
      }
    } catch (error) {
      console.error('Errore caricamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClone = async (id: number) => {
    if (!confirm('Vuoi clonare questo annuncio?')) return;

    try {
      const res = await fetch(`/api/dashboard/quick-meetings/${id}/clone`, {
        method: 'POST',
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        alert(`Errore durante la clonazione: ${e.error || res.statusText}`);
        return;
      }

      const data = await res.json();
      if (data && data.meeting) {
        setMeetings((prev) => [data.meeting, ...prev]);
        alert('Annuncio clonato con successo');
      }
    } catch (error) {
      console.error('Errore clonazione:', error);
      alert('Errore durante la clonazione dell\'annuncio');
    }
  };

  const openPromo = async (meeting: QuickMeeting) => {
    setPromoMeeting(meeting);
    setPromoError(null);
    setPromoSuccess(null);
    setLoadingPackages(true);
    setSelectedPackage(null);
    setActivePurchase(null);
    setDaySlots([]);
    setScheduleSummary([]);
    setLoadingSchedule(true);
    try {
      const [resPackages, resSchedule] = await Promise.all([
        fetch('/api/quick-meetings/packages'),
        (async () => {
          const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') || '' : '';
          if (!token) return null;
          try {
            const r = await fetch(`/api/quick-meetings/schedule?meetingId=${meeting.id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!r.ok) return null;
            const d = await r.json();
            if (!d) return null;

            if (d.purchase) {
              setActivePurchase({
                id: d.purchase.id,
                productCode: d.purchase.productCode,
                productLabel: d.purchase.productLabel,
                type: d.purchase.type,
                expiresAt: d.purchase.expiresAt,
                durationDays: d.purchase.durationDays,
                startedAt: d.purchase.startedAt,
              });
            } else {
              setActivePurchase(null);
            }

            // aggiorna mappa: questo annuncio ha un pacchetto attivo?
            setMeetingHasPackage((prev) => ({
              ...prev,
              [meeting.id]: !!d.purchase,
            }));

            const schedules = Array.isArray(d.schedules) ? d.schedules : [];
            setScheduleSummary(
              schedules.map((s: any) => ({ runAt: s.runAt, window: s.window }))
            );

            // prepara la struttura daySlots solo se abbiamo un pacchetto attivo
            if (d.purchase && d.purchase.startedAt && d.purchase.durationDays) {
              const start = new Date(d.purchase.startedAt);
              const daysArr: { date: string; slots: number[] }[] = [];
              for (let i = 0; i < d.purchase.durationDays; i++) {
                const dayDate = new Date(start.getTime());
                dayDate.setDate(dayDate.getDate() + i);
                const iso = dayDate.toISOString().slice(0, 10);

                // ricava eventuali slot già programmati per quel giorno
                const daySlotsFromSchedule = schedules
                  .filter((s: any) => {
                    const dt = new Date(s.runAt);
                    return dt.toISOString().slice(0, 10) === iso;
                  })
                  .map((s: any) => new Date(s.runAt).getHours());

                const uniqueHours = Array.from<number>(new Set<number>(daySlotsFromSchedule)).sort(
                  (a: number, b: number) => a - b
                );
                daysArr.push({ date: iso, slots: uniqueHours });
              }
              setDaySlots(daysArr);
            } else {
              setDaySlots([]);
            }
          } catch {
            return null;
          }
          return null;
        })()
      ]);

      if (!resPackages.ok) {
        const data = await resPackages.json().catch(() => ({}));
        setPromoError(data.error || 'Impossibile caricare i pacchetti');
        setPackages([]);
        return;
      }
      const data = await resPackages.json();
      setPackages(data.items || []);
    } catch (e) {
      console.error('Errore caricamento pacchetti', e);
      setPromoError('Errore durante il caricamento dei pacchetti');
    } finally {
      setLoadingPackages(false);
      setLoadingSchedule(false);
    }
  };

  const closePromo = () => {
    setPromoMeeting(null);
    setPackages([]);
    setPromoError(null);
    setPromoSuccess(null);
    setPurchaseLoadingCode(null);
    setBumpLoading(false);
    setSelectedPackage(null);
    setActivePurchase(null);
    setDaySlots([]);
    setScheduleSummary([]);
  };

  const toggleDaySlot = (date: string, hour: number) => {
    setDaySlots((prev) => {
      const copy = [...prev];
      const idx = copy.findIndex((d) => d.date === date);
      if (idx === -1) {
        return prev;
      }
      const day = copy[idx];
      let slots = day.slots || [];
      const type = activePurchase?.type || selectedPackage?.type;
      if (type === 'DAY') {
        // un solo slot per giorno
        slots = slots.includes(hour) ? [] : [hour];
      } else {
        // NIGHT: multi-selezione
        slots = slots.includes(hour)
          ? slots.filter((h) => h !== hour)
          : [...slots, hour];
      }
      copy[idx] = { ...day, slots };
      return copy;
    });
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
    // se non è ancora stato fissato il pacchetto selezionato, impostalo ora
    const pkg = packages.find((p) => p.code === code) || null;
    if (!selectedPackage && pkg) {
      setSelectedPackage(pkg);
    }
    try {
      const res = await fetch('/api/quick-meetings/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        // per l'acquisto iniziale non passiamo più slot dettagliati; verranno gestiti dalla schermata di aggiornamento
        body: JSON.stringify({ meetingId: promoMeeting.id, code, slots: [] })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPromoError(data.error || 'Impossibile completare l\'acquisto');
        return;
      }

      // Se il pacchetto è quello di risalita immediata, esegui subito la risalita
      if (code === 'IMMEDIATE') {
        const bumpRes = await fetch('/api/quick-meetings/bump-now', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ meetingId: promoMeeting.id })
        });
        const bumpData = await bumpRes.json().catch(() => ({}));
        if (!bumpRes.ok) {
          setPromoError(bumpData.error || 'Risalita immediata non disponibile');
          return;
        }
        setPromoSuccess('Risalita immediata acquistata ed eseguita con successo');
      } else {
        setPromoSuccess('Pacchetto acquistato con successo');
      }

      // marca l'annuncio corrente come avente un pacchetto attivo
      setMeetingHasPackage((prev) =>
        promoMeeting ? { ...prev, [promoMeeting.id]: true } : prev
      );
    } catch (e) {
      console.error('Errore acquisto pacchetto', e);
      setPromoError('Errore durante l\'acquisto del pacchetto');
    } finally {
      setPurchaseLoadingCode(null);
    }
  };

  // la risalita immediata ora viene gestita tramite il pacchetto IMMEDIATE in handlePurchase

  const handleUpdateSchedule = async () => {
    if (!promoMeeting) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') || '' : '';
    if (!token) {
      alert('Devi effettuare il login per modificare le fasce orarie');
      return;
    }
    setPromoError(null);
    setPromoSuccess(null);
    setLoadingSchedule(true);
    try {
      const res = await fetch('/api/quick-meetings/update-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          meetingId: promoMeeting.id,
          days: daySlots,
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPromoError(data.error || 'Impossibile aggiornare la programmazione');
        return;
      }
      setPromoSuccess('Programmazione aggiornata con successo');

      // ricarica il riepilogo
      const resSchedule = await fetch(`/api/quick-meetings/schedule?meetingId=${promoMeeting.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resSchedule.ok) {
        const d = await resSchedule.json();
        if (d) {
          const schedules = Array.isArray(d.schedules) ? d.schedules : [];
          setScheduleSummary(
            schedules.map((s: any) => ({ runAt: s.runAt, window: s.window }))
          );

          if (d.purchase && d.purchase.startedAt && d.purchase.durationDays) {
            const start = new Date(d.purchase.startedAt);
            const daysArr: { date: string; slots: number[] }[] = [];
            for (let i = 0; i < d.purchase.durationDays; i++) {
              const dayDate = new Date(start.getTime());
              dayDate.setDate(dayDate.getDate() + i);
              const iso = dayDate.toISOString().slice(0, 10);

              const daySlotsFromSchedule = schedules
                .filter((s: any) => {
                  const dt = new Date(s.runAt);
                  return dt.toISOString().slice(0, 10) === iso;
                })
                .map((s: any) => new Date(s.runAt).getHours());

              const uniqueHours = Array.from(new Set(daySlotsFromSchedule)).sort((a, b) => a - b);
              daysArr.push({ date: iso, slots: uniqueHours });
            }
            setDaySlots(daysArr);
          }
        }
      }
    } catch (e) {
      console.error('Errore update schedule', e);
      setPromoError('Errore durante l\'aggiornamento delle fasce orarie');
    } finally {
      setLoadingSchedule(false);
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
                      onClick={() => handleClone(meeting.id)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
                    >
                      📄 Clona
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
                      {meetingHasPackage[meeting.id]
                        ? '🚀 Gestisci pacchetto'
                        : '🚀 Promuovi'}
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
        <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-3xl w-full mx-4 mt-10 mb-10 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
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

            {activePurchase && (
              <div className="mb-3 text-sm text-gray-200 bg-gray-800/80 border border-gray-700 rounded px-3 py-2">
                <div className="font-semibold text-pink-300 mb-1">Pacchetto attivo</div>
                <div className="text-xs text-gray-200">
                  <div>{activePurchase.productLabel}</div>
                  <div>
                    Tipo: {activePurchase.type === 'DAY' ? 'Giorno' : 'Notte'} · Durata: {activePurchase.durationDays}{' '}
                    {activePurchase.durationDays === 1 ? 'giorno' : 'giorni'}
                  </div>
                  <div>
                    Scadenza: {new Date(activePurchase.expiresAt).toLocaleString('it-IT')}
                  </div>
                </div>
              </div>
            )}

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
              <>
                {!activePurchase && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {packages.map((p) => {
                      const isSelected = selectedPackage?.code === p.code;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedPackage(p);
                          }}
                          className={`text-left rounded-xl border p-4 flex flex-col justify-between transition-colors ${
                            p.type === 'DAY'
                              ? 'border-amber-500/60 bg-amber-900/20 hover:border-amber-400'
                              : 'border-indigo-500/60 bg-indigo-900/20 hover:border-indigo-400'
                          } ${isSelected ? 'ring-2 ring-pink-400' : ''}`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-lg font-semibold text-white">{p.label}</h3>
                              <span className="text-xs px-2 py-1 rounded-full bg-black/40 text-gray-200">
                                {p.code === 'IMMEDIATE'
                                  ? 'Risalita immediata'
                                  : p.type === 'DAY'
                                    ? 'Giorno'
                                    : 'Notte'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-300 mb-2">
                              {p.code === 'IMMEDIATE' ? (
                                <span>Esegui una risalita immediata utilizzando 10 crediti.</span>
                              ) : p.type === 'DAY' ? (
                                <span>1 risalita automatica al giorno per {p.durationDays} {p.durationDays === 1 ? 'giorno' : 'giorni'}.</span>
                              ) : (
                                <span>{p.quantityPerWindow} risalite a notte per {p.durationDays} {p.durationDays === 1 ? 'notte' : 'notti'}.</span>
                              )}
                            </div>
                            {p.code !== 'IMMEDIATE' && (
                              <div className="text-sm text-gray-400">
                                Finestra oraria: {p.type === 'DAY' ? '08:00 - 22:00' : '22:00 - 08:00'}
                              </div>
                            )}
                          </div>
                          <div className="mt-4 flex items-center justify-between">
                            <div className="text-lg font-bold text-pink-300">{p.creditsCost} crediti</div>
                            <span className="text-xs text-gray-300">
                              {isSelected ? 'Selezionato' : 'Clicca per selezionare'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Fasce orarie */}
                {(activePurchase || selectedPackage) && daySlots.length > 0 && (
                  <div className="mb-4 border-t border-gray-700 pt-4">
                    <h3 className="text-sm font-semibold text-white mb-2">Fasce orarie per giorno</h3>
                    <p className="text-xs text-gray-400 mb-3">
                      {(activePurchase?.type || selectedPackage?.type) === 'DAY'
                        ? 'Per ogni giorno del pacchetto seleziona una fascia oraria (08:00 - 24:00) in cui avverrà la risalita.'
                        : 'Per ogni notte del pacchetto seleziona una o più fasce orarie notturne (22:00 - 08:00). Le risalite verranno distribuite tra gli orari scelti.'}
                    </p>

                    <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                      {daySlots.map((day) => {
                        const dateLabel = new Date(day.date + 'T00:00:00').toLocaleDateString('it-IT');
                        return (
                          <div key={day.date} className="border border-gray-700/70 rounded-lg p-3 bg-black/20">
                            <div className="text-xs font-semibold text-gray-200 mb-2">
                              Giorno: {dateLabel}
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-xs">
                              {Array.from({ length: 24 }).map((_, h) => {
                                const labelStart = h.toString().padStart(2, '0') + ':00';
                                const labelEnd = ((h + 1) % 24).toString().padStart(2, '0') + ':00';

                                const isDaySlot = h >= 8 && h <= 23;
                                const isNightSlot = h >= 22 || h <= 7;

                                const type = activePurchase?.type || selectedPackage?.type;
                                const enabled = type === 'DAY' ? isDaySlot : isNightSlot;
                                const checked = day.slots.includes(h);

                                if (!enabled) {
                                  return (
                                    <div
                                      key={h}
                                      className="flex items-center gap-1 px-2 py-1 rounded bg-gray-800/60 text-gray-600 cursor-not-allowed border border-gray-700/60"
                                    >
                                      <input type="checkbox" disabled className="opacity-40" />
                                      <span>
                                        {labelStart} - {labelEnd}
                                      </span>
                                    </div>
                                  );
                                }

                                return (
                                  <button
                                    type="button"
                                    key={h}
                                    onClick={() => toggleDaySlot(day.date, h)}
                                    className={`flex items-center gap-1 px-2 py-1 rounded border text-left transition-colors ${
                                      checked
                                        ? 'bg-pink-600/80 border-pink-400 text-white'
                                        : 'bg-gray-800/80 border-gray-600 text-gray-100 hover:border-pink-400'
                                    }`}
                                  >
                                    <span
                                      className={`w-3 h-3 rounded border ${
                                        checked ? 'bg-white border-white' : 'border-gray-400'
                                      }`}
                                    />
                                    <span>
                                      {labelStart} - {labelEnd}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Programmazione risalite */}
                <div className="mt-4 border-t border-gray-700 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-white">Programmazione risalite</h3>
                    {loadingSchedule && (
                      <span className="text-xs text-gray-400">Aggiornamento...</span>
                    )}
                  </div>
                  {scheduleSummary.length === 0 ? (
                    <p className="text-xs text-gray-500">
                      Nessuna risalita futura programmata al momento. Acquista un pacchetto o aggiorna le fasce orarie per generare la programmazione.
                    </p>
                  ) : (
                    <div className="max-h-40 overflow-y-auto rounded border border-gray-700/60 bg-black/20 p-2 text-xs text-gray-200">
                      {Object.entries(
                        scheduleSummary.reduce((acc: Record<string, string[]>, s) => {
                          const d = new Date(s.runAt);
                          const dateKey = d.toLocaleDateString('it-IT');
                          const time = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
                          if (!acc[dateKey]) acc[dateKey] = [];
                          acc[dateKey].push(time);
                          return acc;
                        }, {})
                      ).map(([day, times]) => (
                        <div key={day} className="mb-1">
                          <div className="font-semibold text-gray-100">{day}</div>
                          <div className="text-gray-300">
                            {times.sort().join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex items-center justify-between mt-2 gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                {!activePurchase && (
                  <button
                    onClick={() => selectedPackage && handlePurchase(selectedPackage.code)}
                    disabled={!selectedPackage || purchaseLoadingCode !== null}
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
                  >
                    {!selectedPackage
                      ? 'Seleziona un pacchetto'
                      : purchaseLoadingCode
                        ? 'Acquisto in corso...'
                        : 'Acquista pacchetto'}
                  </button>
                )}
                <button
                  onClick={handleUpdateSchedule}
                  disabled={daySlots.length === 0 || loadingSchedule}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
                >
                  Aggiorna fasce orarie
                </button>
              </div>
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
