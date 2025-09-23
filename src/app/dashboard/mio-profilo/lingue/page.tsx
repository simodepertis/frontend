"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type LangItem = { language: string; level: string };

const LEVELS = [
  "Base",
  "Discreto",
  "Buono",
  "Ottimo",
  "Eccellente / Nativo",
];

export default function LinguePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [list, setList] = useState<LangItem[]>([]);
  const [selLang, setSelLang] = useState("");
  const [selLevel, setSelLevel] = useState("Eccellente / Nativo");

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('auth-token') || '';
        const r = await fetch('/api/profile/lingue', { headers: token? { 'Authorization': `Bearer ${token}` }: undefined });
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
      const j = await r.json().catch(()=>({}));
      if (!r.ok) { alert(j?.error || 'Errore salvataggio lingue'); return; }
      alert('Lingue salvate');
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Lingue" subtitle="Aggiungi lingue e competenza come negli screenshot" />

      <div className="rounded-xl border border-gray-600 bg-gray-800 p-5 space-y-4 max-w-2xl">
        <div className="grid grid-cols-[1fr,1fr,auto] gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-300">Lingua</label>
            <input value={selLang} onChange={(e)=>setSelLang(e.target.value)} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" placeholder="Es. Italian" />
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
          <Button onClick={save} disabled={saving}>{saving? 'Salvo…':'Salva modifiche'}</Button>
        </div>
      </div>
    </div>
  );
}
