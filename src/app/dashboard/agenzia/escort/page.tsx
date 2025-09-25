"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type EscortRow = {
  id: number;
  userId: number;
  nome: string;
  email: string;
  updatedAt: string;
};

export default function AgencyManageEscortsPage() {
  const [rows, setRows] = useState<EscortRow[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [escortUserId, setEscortUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ id: number; nome: string; email: string; agencyId?: number | null }>>([]);
  const debounceRef = useRef<any>(null);
  const [langFilter, setLangFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/agency/escorts');
      if (res.ok) {
        const { escorts } = await res.json();
        const mapped: EscortRow[] = (escorts || []).map((e: any) => ({
          id: e.id,
          userId: e.userId,
          nome: e.user?.nome || `User ${e.userId}`,
          email: e.user?.email || '',
          updatedAt: e.updatedAt,
        }));
        setRows(mapped);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Autocomplete search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.trim().length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/agency/escorts/search?query=${encodeURIComponent(query)}`);
        if (res.ok) {
          const { results } = await res.json();
          setResults((results || []).map((u: any) => ({ id: u.id, nome: u.nome, email: u.email, agencyId: u.escortProfile?.agencyId ?? null })));
        }
      } catch {}
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  async function linkEscort(action: 'link' | 'unlink', id?: number) {
    setLinking(true);
    try {
      if (action === 'unlink') {
        const ok = window.confirm('Confermi di voler scollegare questa escort dalla tua agenzia?');
        if (!ok) { setLinking(false); return; }
      }
      const body = action === 'link' ? { escortUserId: Number(escortUserId), action } : { escortUserId: id, action };
      const res = await fetch('/api/agency/escorts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) {
        const txt = await res.text();
        alert(`Operazione fallita: ${txt}`);
      } else {
        setEscortUserId("");
        await load();
      }
    } finally {
      setLinking(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Gestione Escort" subtitle="Collega o scollega i profili Escort alla tua Agenzia" />

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-white font-semibold">Le tue Escort</div>
          <Button onClick={() => setShowCreate(v => !v)}>{showCreate ? 'Annulla' : 'Aggiungi nuova Escort'}</Button>
        </div>
        {showCreate && (
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            <input value={newName} onChange={(e)=> setNewName(e.target.value)} placeholder="Nome" className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 w-full placeholder-gray-400" />
            <input value={newEmail} onChange={(e)=> setNewEmail(e.target.value)} placeholder="Email" className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 w-full placeholder-gray-400" />
            <div className="flex gap-2">
              <input type="password" value={newPassword} onChange={(e)=> setNewPassword(e.target.value)} placeholder="Password" className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 w-full placeholder-gray-400" />
              <Button disabled={creating || !newName || !newEmail || newPassword.length < 6} onClick={async ()=>{
                setCreating(true);
                try {
                  const res = await fetch('/api/agency/escorts/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: newName, email: newEmail, password: newPassword }) });
                  const j = await res.json();
                  if (!res.ok) { alert(j?.error || 'Errore creazione'); }
                  else {
                    setShowCreate(false); setNewName(''); setNewEmail(''); setNewPassword('');
                    await load();
                    window.location.href = `/dashboard/agenzia/escort/compila/biografia?escortUserId=${j.userId}`;
                  }
                } finally { setCreating(false); }
              }}>{creating ? 'Creazione…' : 'Crea & Compila'}</Button>
            </div>
          </div>
        )}
        <div className="text-sm text-gray-300">Per collegare una escort, inserisci l'ID Utente dell'Escort e conferma. In futuro potremo aggiungere una ricerca avanzata.</div>
        <div className="flex items-center gap-2">
          <input value={escortUserId} onChange={(e) => setEscortUserId(e.target.value)} placeholder="ID Utente Escort" className="border rounded-md px-3 py-2 w-48" />
          <Button onClick={() => linkEscort('link')} disabled={!escortUserId || linking}>Collega</Button>
        </div>
        <div className="pt-3">
          <div className="text-sm font-semibold mb-1">Oppure cerca per nome/email</div>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cerca per nome o email" className="border rounded-md px-3 py-2 w-full" />
            <input value={langFilter} onChange={(e) => setLangFilter(e.target.value)} placeholder="Filtro lingua (IT, EN, ...)" className="border rounded-md px-3 py-2 w-full" />
            <input value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} placeholder="Filtro città" className="border rounded-md px-3 py-2 w-full" />
            <input value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} placeholder="Filtro servizio (es. Massaggio)" className="border rounded-md px-3 py-2 w-full" />
          </div>
          {query.trim().length >= 2 && (
            <div className="mt-2 border rounded-md divide-y">
              {results
                .filter(u => {
                  // client-side filters using data-rich results from API (languages/cities/services) quando disponibili
                  const any = (v?: any) => Array.isArray(v) ? v : [];
                  const prof: any = (u as any).escortProfile || {};
                  const langs: string[] = any(prof.languages);
                  const cities: string[] = any(prof.cities);
                  const services: any = prof.services || { general: [], extra: [], fetish: [], virtual: [] };
                  const allServices: string[] = [...any(services.general), ...any(services.extra), ...any(services.fetish), ...any(services.virtual)];
                  const langOk = !langFilter || langs.join(' ').toLowerCase().includes(langFilter.toLowerCase());
                  const cityOk = !cityFilter || cities.join(' ').toLowerCase().includes(cityFilter.toLowerCase());
                  const svcOk = !serviceFilter || allServices.join(' ').toLowerCase().includes(serviceFilter.toLowerCase());
                  return langOk && cityOk && svcOk;
                })
                .length === 0 ? (
                <div className="p-2 text-sm text-neutral-500">Nessun risultato</div>
              ) : results
                .filter(u => {
                  const any = (v?: any) => Array.isArray(v) ? v : [];
                  const prof: any = (u as any).escortProfile || {};
                  const langs: string[] = any(prof.languages);
                  const cities: string[] = any(prof.cities);
                  const services: any = prof.services || { general: [], extra: [], fetish: [], virtual: [] };
                  const allServices: string[] = [...any(services.general), ...any(services.extra), ...any(services.fetish), ...any(services.virtual)];
                  const langOk = !langFilter || langs.join(' ').toLowerCase().includes(langFilter.toLowerCase());
                  const cityOk = !cityFilter || cities.join(' ').toLowerCase().includes(cityFilter.toLowerCase());
                  const svcOk = !serviceFilter || allServices.join(' ').toLowerCase().includes(serviceFilter.toLowerCase());
                  return langOk && cityOk && svcOk;
                })
                .map(u => (
                <div key={u.id} className="p-2 text-sm flex items-center justify-between hover:bg-neutral-50">
                  <div>
                    <div className="font-medium">{u.nome} (User #{u.id})</div>
                    <div className="text-xs text-neutral-600">{u.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {u.agencyId && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Collegata ad un'altra agenzia</span>}
                    <Button variant="secondary" onClick={() => setEscortUserId(String(u.id))}>Seleziona</Button>
                    <Button onClick={() => linkEscort('link', u.id)} disabled={!!u.agencyId || linking}>Collega</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <div className="font-semibold mb-3 text-white">Escort collegate ({rows.length})</div>
        {loading ? (
          <div className="text-sm text-neutral-500">Caricamento…</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-neutral-500">Nessuna escort collegata al momento.</div>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="border rounded-md p-3 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="font-medium text-sm">{r.nome} (User #{r.userId})</div>
                  <div className="text-xs text-neutral-600">{r.email}</div>
                </div>
                <div>
                  <Button variant="secondary" onClick={() => linkEscort('unlink', r.userId)} disabled={linking}>Scollega</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
