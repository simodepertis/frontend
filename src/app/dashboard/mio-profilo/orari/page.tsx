"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Day = 'Lun' | 'Mar' | 'Mer' | 'Gio' | 'Ven' | 'Sab' | 'Dom';
const DAYS: Day[] = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom'];

type Slot = { from: string; to: string };

type WorkingHours = {
  mode: 'custom' | 'same' | '247';
  same?: Slot[];
  perDay?: { [K in Day]?: Slot[] };
  vacations?: Array<{ from: string; to: string }>;
};

export default function OrariPage(){
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [wh, setWh] = useState<WorkingHours>({ mode: '247', same: [{ from: '00:00', to: '23:59' }] });

  useEffect(()=>{
    (async()=>{
      try{
        const token = localStorage.getItem('auth-token')||'';
        const r = await fetch('/api/profile/orari', { headers: token? { Authorization: `Bearer ${token}` }: undefined });
        if (r.ok){
          const j = await r.json();
          if (j?.workingHours) setWh(j.workingHours);
        }
      } finally { setLoading(false); }
    })();
  },[]);

  function addSame(){ setWh(p=>({ ...p, same: [...(p.same||[]), { from:'09:00', to:'18:00' }] })); }
  function rmSame(i:number){ setWh(p=>({ ...p, same: (p.same||[]).filter((_,ix)=>ix!==i) })); }

  function addPerDay(d:Day){ setWh(p=>({ ...p, perDay: { ...(p.perDay||{}), [d]: [ ...(p.perDay?.[d]||[]), { from:'09:00', to:'18:00' } ] } })); }
  function rmPerDay(d:Day,i:number){ setWh(p=>({ ...p, perDay: { ...(p.perDay||{}), [d]: (p.perDay?.[d]||[]).filter((_,ix)=>ix!==i) } })); }

  function addVacation(){ setWh(p=>({ ...p, vacations: [ ...(p.vacations||[]), { from:'', to:'' } ] })); }
  function rmVacation(i:number){ setWh(p=>({ ...p, vacations: (p.vacations||[]).filter((_,ix)=>ix!==i) })); }

  async function save(){
    setSaving(true);
    try{
      const token = localStorage.getItem('auth-token')||'';
      const r = await fetch('/api/profile/orari', { method:'PATCH', headers:{ 'Content-Type':'application/json', ...(token? { Authorization: `Bearer ${token}`}: {}) }, body: JSON.stringify({ workingHours: wh }) });
      const j = await r.json().catch(()=>({}));
      if (!r.ok){ alert(j?.error || 'Errore salvataggio orari'); return; }
      alert('Orari salvati');
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Orari di Lavoro" subtitle="Orario personalizzato, stesso ogni giorno o 24/7 + vacanze" />

      <div className="rounded-xl border border-gray-600 bg-gray-800 p-5 space-y-4">
        {/* Switch modalità */}
        <div className="flex gap-2">
          {([
            { k:'custom', l:'Orario personalizzato' },
            { k:'same', l:'Lo stesso ogni giorno' },
            { k:'247', l:'Sono disponibile 24/7' },
          ] as any[]).map(x=> (
            <button key={x.k} onClick={()=>setWh(p=>({ ...p, mode: x.k }))} className={`px-3 py-1 rounded-full text-sm ${wh.mode===x.k? 'bg-blue-600 text-white':'bg-gray-700 text-gray-200'}`}>{x.l}</button>
          ))}
        </div>

        {/* same every day */}
        {wh.mode==='same' && (
          <div className="space-y-2">
            {(wh.same||[]).map((s,i)=> (
              <div key={i} className="grid grid-cols-[1fr,1fr,auto] gap-2 items-center">
                <input value={s.from} onChange={(e)=>setWh(p=>{ const a=[...(p.same||[])]; a[i]={ ...a[i], from:e.target.value }; return { ...p, same:a }; })} className="inp" type="time" />
                <input value={s.to} onChange={(e)=>setWh(p=>{ const a=[...(p.same||[])]; a[i]={ ...a[i], to:e.target.value }; return { ...p, same:a }; })} className="inp" type="time" />
                <Button variant="secondary" onClick={()=>rmSame(i)}>Rimuovi</Button>
              </div>
            ))}
            <Button variant="secondary" onClick={addSame}>+ Aggiungi fascia</Button>
          </div>
        )}

        {/* custom per giorno */}
        {wh.mode==='custom' && (
          <div className="space-y-4">
            {DAYS.map(d=> (
              <div key={d} className="space-y-2">
                <div className="text-sm text-gray-300">{d}</div>
                {(wh.perDay?.[d]||[]).map((s,i)=> (
                  <div key={i} className="grid grid-cols-[1fr,1fr,auto] gap-2 items-center">
                    <input value={s.from} onChange={(e)=>setWh(p=>{ const arr=[...(p.perDay?.[d]||[])]; arr[i]={ ...arr[i], from:e.target.value }; return { ...p, perDay:{ ...(p.perDay||{}), [d]:arr } }; })} className="inp" type="time" />
                    <input value={s.to} onChange={(e)=>setWh(p=>{ const arr=[...(p.perDay?.[d]||[])]; arr[i]={ ...arr[i], to:e.target.value }; return { ...p, perDay:{ ...(p.perDay||{}), [d]:arr } }; })} className="inp" type="time" />
                    <Button variant="secondary" onClick={()=>rmPerDay(d,i)}>Rimuovi</Button>
                  </div>
                ))}
                <Button variant="secondary" onClick={()=>addPerDay(d)}>+ Aggiungi fascia</Button>
              </div>
            ))}
          </div>
        )}

        {/* 24/7 */}
        {wh.mode==='247' && (
          <div className="text-sm text-gray-300">Disponibilità continua. Nessuna fascia oraria specifica.</div>
        )}

        {/* Vacanze */}
        <div className="pt-4 space-y-2">
          <div className="font-semibold text-white">Vacanze</div>
          {(wh.vacations||[]).map((v,i)=> (
            <div key={i} className="grid grid-cols-[1fr,1fr,auto] gap-2 items-center">
              <input type="date" value={v.from} onChange={(e)=>setWh(p=>{ const arr=[...(p.vacations||[])]; arr[i]={ ...arr[i], from:e.target.value }; return { ...p, vacations:arr }; })} className="inp" />
              <input type="date" value={v.to} onChange={(e)=>setWh(p=>{ const arr=[...(p.vacations||[])]; arr[i]={ ...arr[i], to:e.target.value }; return { ...p, vacations:arr }; })} className="inp" />
              <Button variant="secondary" onClick={()=>rmVacation(i)}>Rimuovi</Button>
            </div>
          ))}
          <Button variant="secondary" onClick={addVacation}>+ Aggiungi vacanza</Button>
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>{saving? 'Salvo…':'Salva modifiche'}</Button>
        </div>
      </div>

      <style jsx>{`
        .inp { background:#374151; border:1px solid #4b5563; color:#fff; border-radius:0.375rem; padding:0.5rem 0.75rem; }
      `}</style>
    </div>
  );
}
