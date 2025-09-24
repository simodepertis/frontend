"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type LangItem = { language: string; level: string };

const LEVELS = [
  "Base",
  "Discreto",
  "Buono",
  "Ottimo",
  "Eccellente / Nativo",
];

export default function LinguePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [list, setList] = useState<LangItem[]>([]);
  const [selLang, setSelLang] = useState("");
  const [selLevel, setSelLevel] = useState("Eccellente / Nativo");
  const [openLang, setOpenLang] = useState(false);
  const [langQuery, setLangQuery] = useState("");

  const LANGUAGE_OPTIONS = useMemo(() => [
    "Italiano","Inglese","Francese","Spagnolo","Tedesco","Portoghese",
    "Rumeno","Russo","Ucraino","Polacco","Albanese","Arabo",
    "Cinese","Giapponese","Olandese","Svedese","Norvegese","Danese",
    "Turco","Greco","Ceco","Ungherese","Serbo","Croato","Slovacco",
    "Sloveno","Bulgaro","Portoghese Brasiliano","Cantonese","Coreano"
  ], []);

  const filteredLanguages = useMemo(() => {
    const q = (langQuery || selLang).trim().toLowerCase();
    const base = LANGUAGE_OPTIONS;
    if (!q) return base;
    return base.filter(l => l.toLowerCase().includes(q));
  }, [LANGUAGE_OPTIONS, langQuery, selLang]);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('auth-token') || '';
        const r = await fetch('/api/profile/lingue', { headers: token? { 'Authorization': `Bearer ${token}` }: undefined });
        if (r.status === 401) { window.location.href = `/autenticazione?redirect=${encodeURIComponent(window.location.pathname)}`; return; }
        if (r.ok) {
          const j = await r.json();
          setList(Array.isArray(j?.languages) ? j.languages : []);
        }
      } finally { setLoading(false); }
    })();
  }, []);

  function addLang() {
    const lng = selLang.trim();
    if (!lng) { alert('Inserisci una lingua'); return; }
    setList(prev => {
      const others = prev.filter(x => x.language.toLowerCase() !== lng.toLowerCase());
      return [...others, { language: lng, level: selLevel }];
    });
    setSelLang("");
  }

  async function save() {
    setSaving(true);
    try {
      const token = localStorage.getItem('auth-token') || '';
      const r = await fetch('/api/profile/lingue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token? { 'Authorization': `Bearer ${token}` }: {}) },
        body: JSON.stringify({ languages: list })
      });
      if (r.status === 401) { window.location.href = `/autenticazione?redirect=${encodeURIComponent(window.location.pathname)}`; return; }
      if (!r.ok) { const j = await r.json().catch(()=>({})); alert(j?.error || 'Errore salvataggio lingue'); return; }
      // Avanza a Città di Lavoro (percorso corretto)
      router.push('/dashboard/mio-profilo/citta-di-lavoro');
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Lingue" subtitle="Aggiungi lingue e competenza come negli screenshot" />

      <div className="rounded-xl border border-gray-600 bg-gray-800 p-5 space-y-4 max-w-2xl">
        <div className="grid grid-cols-[1fr,1fr,auto] gap-3 items-end">
          <div className="flex flex-col gap-1 relative">
            <label className="text-sm text-gray-300">Lingua</label>
            <div className="relative">
              <input
                value={selLang}
                onChange={(e)=>{ setSelLang(e.target.value); setLangQuery(e.target.value); setOpenLang(true); }}
                onFocus={()=>setOpenLang(true)}
                className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 w-full pr-9"
                placeholder="Es. Italiano"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={()=>setOpenLang((v)=>!v)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 grid place-items-center rounded-md bg-gray-700 border border-gray-600 text-gray-300"
                aria-label="Apri lista lingue"
              >⌄</button>
            </div>
            {openLang && (
              <div className="absolute z-20 top-[62px] w-full max-h-56 overflow-auto rounded-md border border-gray-600 divide-y divide-gray-700 bg-gray-900">
                {filteredLanguages.map((l)=> (
                  <button
                    key={l}
                    type="button"
                    onClick={()=>{ setSelLang(l); setLangQuery(""); setOpenLang(false); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-800 text-gray-200"
                  >{l}</button>
                ))}
                {filteredLanguages.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-400">Nessun risultato</div>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-300">Competenza</label>
            <select value={selLevel} onChange={(e)=>setSelLevel(e.target.value)} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2">
              {LEVELS.map(l=> <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <Button onClick={addLang}>+</Button>
        </div>

        <div className="space-y-2">
          {list.length === 0 ? (
            <div className="text-sm text-gray-400">Non ci sono lingue definite</div>
          ) : (
            list.map((it)=> (
              <div key={it.language} className="flex items-center justify-between border border-gray-600 rounded-md px-3 py-2 text-sm">
                <div>{it.language}</div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-gray-300">{it.level}</div>
                  <Button variant="secondary" onClick={()=>setList(prev=>prev.filter(x=>x.language!==it.language))}>Rimuovi</Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>{saving? 'Salvo…':'Salva e continua'}</Button>
        </div>
      </div>
    </div>
  );
}
