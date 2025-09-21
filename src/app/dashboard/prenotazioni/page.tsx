"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

export default function PrenotazioniIstantaneePage() {
  type DayKey = "lun" | "mar" | "mer" | "gio" | "ven" | "sab" | "dom";
  type TimeRange = { start: string; end: string };
  type BookingRequest = { id: string; name: string; when: string; duration: string; note?: string; status: "new" | "accepted" | "declined" };

  const DAYS: DayKey[] = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"];
  const DURATIONS = ["30 min", "1 ora", "2 ore", "Notte"];
  const NOTICES = ["nessun preavviso", "30 minuti", "1 ora", "2 ore", "6 ore", "24 ore"];

  const [enabled, setEnabled] = useState(false);
  const [minNotice, setMinNotice] = useState<string>("1 ora");
  const [allowedDurations, setAllowedDurations] = useState<string[]>(["1 ora", "2 ore"]);
  const [prices, setPrices] = useState<Record<string, number>>({ "30 min": 120, "1 ora": 160, "2 ore": 300, "Notte": 1200 });
  const [schedule, setSchedule] = useState<Record<DayKey, { active: boolean; ranges: TimeRange[] }>>({
    lun: { active: true, ranges: [{ start: "10:00", end: "13:00" }, { start: "16:00", end: "20:00" }] },
    mar: { active: true, ranges: [{ start: "10:00", end: "13:00" }, { start: "16:00", end: "20:00" }] },
    mer: { active: true, ranges: [{ start: "10:00", end: "13:00" }, { start: "16:00", end: "20:00" }] },
    gio: { active: true, ranges: [{ start: "10:00", end: "13:00" }, { start: "16:00", end: "20:00" }] },
    ven: { active: true, ranges: [{ start: "10:00", end: "13:00" }, { start: "16:00", end: "22:00" }] },
    sab: { active: false, ranges: [{ start: "15:00", end: "22:00" }] },
    dom: { active: false, ranges: [] },
  });
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string>("");

  // Persistenza localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("escort-booking-settings");
      if (raw) {
        const j = JSON.parse(raw);
        setEnabled(!!j.enabled);
        setMinNotice(j.minNotice || "1 ora");
        setAllowedDurations(Array.isArray(j.allowedDurations) ? j.allowedDurations : ["1 ora", "2 ore"]);
        setPrices(j.prices || prices);
        setSchedule(j.schedule || schedule);
      }
    } catch {}
    try {
      const r = localStorage.getItem("escort-booking-requests");
      if (r) setRequests(JSON.parse(r));
      else setRequests(mockRequests());
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem("escort-booking-settings", JSON.stringify({ enabled, minNotice, allowedDurations, prices, schedule })); } catch {}
  }, [enabled, minNotice, allowedDurations, prices, schedule]);
  useEffect(() => {
    try { localStorage.setItem("escort-booking-requests", JSON.stringify(requests)); } catch {}
  }, [requests]);

  // Carica da backend
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/escort/booking/settings');
        if (res.ok) {
          const { settings } = await res.json();
          if (settings) {
            setEnabled(!!settings.enabled);
            setMinNotice(settings.minNotice || "1 ora");
            setAllowedDurations(Array.isArray(settings.allowedDurations) ? settings.allowedDurations : ["1 ora", "2 ore"]);
            setPrices(settings.prices || prices);
            setSchedule(settings.schedule || schedule);
          }
        }
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveSettings() {
    setSaving(true);
    try {
      const res = await fetch('/api/escort/booking/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, minNotice, allowedDurations, prices, schedule })
      });
      if (!res.ok) throw new Error('Errore salvataggio');
      setSavedAt(new Date().toLocaleTimeString());
    } catch {
      // fallback: già salvato in localStorage
    } finally {
      setSaving(false);
    }
  }

  function toggleDuration(d: string) {
    setAllowedDurations((prev) => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }
  function setPrice(d: string, val: number) {
    setPrices((p) => ({ ...p, [d]: isNaN(val) ? 0 : val }));
  }
  function addRange(day: DayKey) {
    setSchedule((s) => ({ ...s, [day]: { ...s[day], ranges: [...s[day].ranges, { start: "09:00", end: "12:00" }] } }));
  }
  function removeRange(day: DayKey, idx: number) {
    setSchedule((s) => ({ ...s, [day]: { ...s[day], ranges: s[day].ranges.filter((_, i) => i !== idx) } }));
  }
  function updateRange(day: DayKey, idx: number, key: keyof TimeRange, value: string) {
    setSchedule((s) => ({
      ...s,
      [day]: { ...s[day], ranges: s[day].ranges.map((r, i) => i === idx ? { ...r, [key]: value } : r) }
    }));
  }

  function mockRequests(): BookingRequest[] {
    return [
      { id: "r1", name: "Marco", when: "Oggi 18:00", duration: "1 ora", note: "Hotel Duomo", status: "new" },
      { id: "r2", name: "Luca", when: "Domani 21:00", duration: "2 ore", note: "Appartamento centro", status: "new" },
    ];
  }

  // Collega richieste al backend
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/escort/booking/requests');
        if (res.ok) {
          const { requests: list } = await res.json();
          if (Array.isArray(list)) {
            const mapped: BookingRequest[] = list.map((r: any) => ({
              id: String(r.id),
              name: r.name,
              when: r.when,
              duration: r.duration,
              note: r.note || undefined,
              status: r.status === 'ACCEPTED' ? 'accepted' : r.status === 'DECLINED' ? 'declined' : 'new',
            }));
            setRequests(mapped);
          }
        }
      } catch {}
    })();
  }, []);

  async function accept(id: string) {
    setRequests((rs) => rs.map(r => r.id === id ? { ...r, status: "accepted" } : r));
    try { await fetch('/api/escort/booking/requests', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: Number(id), action: 'accept' }) }); } catch {}
  }
  async function decline(id: string) {
    setRequests((rs) => rs.map(r => r.id === id ? { ...r, status: "declined" } : r));
    try { await fetch('/api/escort/booking/requests', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: Number(id), action: 'decline' }) }); } catch {}
  }

  async function generateMock() {
    try {
      const res = await fetch('/api/escort/booking/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Cliente Test', when: 'Oggi 19:00', duration: '1 ora', note: 'Hotel Centro' }) });
      if (res.ok) {
        const { request } = await res.json();
        setRequests((rs) => [{ id: String(request.id), name: request.name, when: request.when, duration: request.duration, note: request.note || undefined, status: 'new' }, ...rs]);
      }
    } catch {}
  }

  const isConfigOk = useMemo(() => allowedDurations.length > 0, [allowedDurations]);

  return (
    <div className="space-y-6">
      <SectionHeader title="Prenotazioni Istantanee" subtitle="Gestisci le richieste in arrivo e la tua disponibilità" />

      {/* Stato prenotazioni */}
      <div className="rounded-lg border bg-white p-4 flex items-center justify-between">
        <div>
          <div className="font-semibold">Prenotazioni Istantanee</div>
          <div className="text-sm text-neutral-600">Permetti agli utenti di prenotare direttamente negli orari disponibili.</div>
        </div>
        <Button variant={enabled ? "default" : "secondary"} onClick={() => setEnabled(v => !v)}>
          {enabled ? "Disattiva" : "Attiva"}
        </Button>
      </div>

      {/* Salvataggio backend */}
      <div className="flex items-center justify-end gap-3">
        {savedAt && <div className="text-xs text-neutral-500">Salvato alle {savedAt}</div>}
        <Button onClick={saveSettings} disabled={saving}>{saving ? 'Salvataggio…' : 'Salva impostazioni'}</Button>
      </div>

      {/* Regole principali */}
      <div className="rounded-lg border bg-white p-4 grid md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm font-semibold mb-2">Preavviso minimo</div>
          <select value={minNotice} onChange={(e) => setMinNotice(e.target.value)} className="border rounded-md px-3 py-2 w-full">
            {NOTICES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <div className="text-sm font-semibold mb-2">Durate consentite</div>
          <div className="flex flex-wrap gap-2">
            {DURATIONS.map(d => (
              <button key={d} onClick={() => toggleDuration(d)} className={`text-sm px-3 py-1 rounded-full border ${allowedDurations.includes(d) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-neutral-700'}`}>
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Prezzi per durata */}
      <div className="rounded-lg border bg-white p-4">
        <div className="text-sm font-semibold mb-3">Prezzi (EUR)</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {DURATIONS.map(d => (
            <div key={d} className="flex items-center gap-2">
              <label className="text-sm w-20">{d}</label>
              <input type="number" min={0} value={prices[d] ?? 0} onChange={(e) => setPrice(d, parseInt(e.target.value, 10))} className="border rounded-md px-3 py-2 w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Orari settimanali */}
      <div className="rounded-lg border bg-white p-4">
        <div className="text-sm font-semibold mb-3">Disponibilità settimanale</div>
        <div className="space-y-4">
          {DAYS.map((day) => (
            <div key={day} className="border rounded-md p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="capitalize font-medium">{day}</div>
                <label className="text-sm flex items-center gap-2">
                  <input type="checkbox" checked={schedule[day].active} onChange={(e) => setSchedule((s) => ({ ...s, [day]: { ...s[day], active: e.target.checked } }))} />
                  Attivo
                </label>
              </div>
              {schedule[day].active && (
                <div className="space-y-2">
                  {schedule[day].ranges.map((r, idx) => (
                    <div key={idx} className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-center">
                      <label className="text-xs text-neutral-600 sm:col-span-1">Inizio</label>
                      <input type="time" value={r.start} onChange={(e) => updateRange(day, idx, 'start', e.target.value)} className="border rounded-md px-2 py-1" />
                      <label className="text-xs text-neutral-600 sm:col-span-1">Fine</label>
                      <input type="time" value={r.end} onChange={(e) => updateRange(day, idx, 'end', e.target.value)} className="border rounded-md px-2 py-1" />
                      <Button variant="secondary" onClick={() => removeRange(day, idx)}>Rimuovi</Button>
                    </div>
                  ))}
                  <div>
                    <Button variant="secondary" onClick={() => addRange(day)}>Aggiungi fascia</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Richieste in arrivo */}
      <div className="rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">Richieste ricevute</div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-neutral-500">Configurazione {isConfigOk ? 'completa' : 'incompleta: abilita almeno una durata'}</div>
            <Button variant="secondary" onClick={generateMock}>Genera richiesta di prova</Button>
          </div>
        </div>
        {requests.length === 0 ? (
          <div className="text-sm text-neutral-500">Nessuna richiesta al momento.</div>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="border rounded-md p-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-sm">{r.name} · {r.when}</div>
                  <div className="text-xs text-neutral-600">Durata: {r.duration}{r.note ? ` · Note: ${r.note}` : ''}</div>
                </div>
                <div className="flex items-center gap-2">
                  {r.status === 'new' && (
                    <>
                      <Button onClick={() => accept(r.id)}>Accetta</Button>
                      <Button variant="secondary" onClick={() => decline(r.id)}>Rifiuta</Button>
                    </>
                  )}
                  {r.status !== 'new' && (
                    <span className={`text-xs px-2 py-1 rounded-full ${r.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {r.status === 'accepted' ? 'Accettata' : 'Rifiutata'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
