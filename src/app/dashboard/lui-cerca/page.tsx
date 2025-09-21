"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

export default function LuiCercaPage() {
  type FeedItem = { id: string; name: string; when: string; duration: string; note?: string; status: "new" | "accepted" | "declined" };
  const [items, setItems] = useState<FeedItem[]>([]);
  const [city, setCity] = useState("");
  const [duration, setDuration] = useState("");
  const [onlyNew, setOnlyNew] = useState(false);
  const [replies, setReplies] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/API/escort/booking/requests');
        if (res.ok) {
          const { requests } = await res.json();
          const mapped: FeedItem[] = (requests || []).map((r: any) => ({ id: String(r.id), name: r.name, when: r.when, duration: r.duration, note: r.note || undefined, status: r.status === 'ACCEPTED' ? 'accepted' : r.status === 'DECLINED' ? 'declined' : 'new' }));
          setItems(mapped);
        } else {
          // fallback mock
          setItems([
            { id: 'm1', name: 'Cliente Milano', when: 'Oggi 18:00', duration: '1 ora', note: 'Milano centro', status: 'new' },
            { id: 'm2', name: 'Turista Roma', when: 'Domani 21:00', duration: '2 ore', note: 'Zona Colosseo', status: 'new' },
          ]);
        }
      } catch {
        setItems([
          { id: 'm1', name: 'Cliente Milano', when: 'Oggi 18:00', duration: '1 ora', note: 'Milano centro', status: 'new' },
          { id: 'm2', name: 'Turista Roma', when: 'Domani 21:00', duration: '2 ore', note: 'Zona Colosseo', status: 'new' },
        ]);
      }
      try { const raw = localStorage.getItem('lui-cerca-replies'); if (raw) setReplies(JSON.parse(raw)); } catch {}
    })();
  }, []);

  useEffect(() => { try { localStorage.setItem('lui-cerca-replies', JSON.stringify(replies)); } catch {} }, [replies]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const txt = `${i.name} ${i.when} ${i.note || ''}`.toLowerCase();
      const cityOk = !city || txt.includes(city.toLowerCase());
      const durOk = !duration || (i.duration || '').toLowerCase().includes(duration.toLowerCase());
      const newOk = !onlyNew || i.status === 'new';
      return cityOk && durOk && newOk;
    });
  }, [items, city, duration, onlyNew]);

  function sendReply(id: string) {
    const msg = (replies[id] || '').trim();
    if (!msg) return;
    alert('Risposta inviata: ' + msg + '\n(Funzionalità placeholder: in produzione invieremo messaggi/contatti)');
    setReplies((r) => ({ ...r, [id]: '' }));
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Lui Cerca" subtitle="Scopri cosa cercano i clienti e rispondi" />

      {/* Filtri */}
      <div className="rounded-lg border bg-white p-4 grid md:grid-cols-4 gap-3">
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Filtra per città" className="border rounded-md px-3 py-2" />
        <input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Durata (es. 1 ora)" className="border rounded-md px-3 py-2" />
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" checked={onlyNew} onChange={(e) => setOnlyNew(e.target.checked)} />
          Solo nuove
        </label>
        <div className="text-sm text-neutral-500 self-center">Risultati: {filtered.length}</div>
      </div>

      {/* Lista feed */}
      <div className="rounded-lg border bg-white p-4">
        {filtered.length === 0 ? (
          <div className="text-sm text-neutral-500">Nessuna richiesta corrispondente ai filtri.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((i) => (
              <div key={i.id} className="border rounded-md p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{i.name} · {i.when}</div>
                    <div className="text-xs text-neutral-600">Durata: {i.duration}{i.note ? ` · ${i.note}` : ''}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${i.status === 'accepted' ? 'bg-green-100 text-green-700' : i.status === 'declined' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{i.status === 'accepted' ? 'Accettata' : i.status === 'declined' ? 'Rifiutata' : 'Nuova'}</span>
                </div>
                <div className="grid md:grid-cols-[1fr_auto] gap-2">
                  <input value={replies[i.id] || ''} onChange={(e) => setReplies((r) => ({ ...r, [i.id]: e.target.value }))} placeholder="Scrivi una risposta o proposta..." className="border rounded-md px-3 py-2" />
                  <Button onClick={() => sendReply(i.id)}>Invia</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
