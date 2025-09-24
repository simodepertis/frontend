"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function BiografiaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nomeProfilo: "",
    slogan: "",
    eta: "",
    sesso: "Donna",
    tipoProfilo: "Single",
    nazionalita: "",
    cittaResidenza: "",
    fisico: {
      capelli: "",
      occhi: "",
      altezza: "",
      peso: "",
      seno: "",
      vita: "",
      fianchi: "",
      tatuaggi: false,
      piercing: false,
    },
    bioIt: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("auth-token") || "";
        const r = await fetch("/api/profile/biografia", { headers: token? { Authorization: `Bearer ${token}`}: undefined });
        if (r.ok) {
          const j = await r.json();
          if (j?.bioIt) setForm(f=>({ ...f, bioIt: j.bioIt }));
          if (j?.info) setForm(f=>({ ...f, ...j.info }));
        }
      } finally { setLoading(false); }
    })();
  }, []);

  async function save() {
    setSaving(true);
    try {
      const token = localStorage.getItem("auth-token") || "";
      const r = await fetch('/api/profile/biografia', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token? { Authorization: `Bearer ${token}`}: {}) },
        body: JSON.stringify({ bioIt: form.bioIt, info: { ...form, bioIt: undefined } })
      });
      if (!r.ok) { const j = await r.json().catch(()=>({})); alert(j?.error || 'Errore salvataggio biografia'); return; }
      // Avanza allo step successivo: Lingue (percorso corretto)
      router.push('/dashboard/mio-profilo/lingue');
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Biografia" subtitle="Dati base, caratteristiche fisiche e testo biografico" />

      <div className="rounded-xl border border-gray-600 bg-gray-800 p-5 space-y-4 max-w-4xl">
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Nome Profilo"><input value={form.nomeProfilo} onChange={(e)=>setForm(f=>({ ...f, nomeProfilo: e.target.value }))} className="inp" /></Field>
          <Field label="Slogan"><input value={form.slogan} onChange={(e)=>setForm(f=>({ ...f, slogan: e.target.value }))} className="inp" /></Field>
          <Field label="Età"><input value={form.eta} onChange={(e)=>setForm(f=>({ ...f, eta: e.target.value }))} className="inp" /></Field>
          <Field label="Sesso"><select value={form.sesso} onChange={(e)=>setForm(f=>({ ...f, sesso: e.target.value }))} className="inp"><option>Donna</option><option>Uomo</option><option>Trans</option></select></Field>
          <Field label="Tipo profilo"><select value={form.tipoProfilo} onChange={(e)=>setForm(f=>({ ...f, tipoProfilo: e.target.value }))} className="inp"><option>Single</option><option>Duo</option></select></Field>
          <Field label="Nazionalità"><input value={form.nazionalita} onChange={(e)=>setForm(f=>({ ...f, nazionalita: e.target.value }))} className="inp" /></Field>
          <Field label="Città di residenza" className="md:col-span-3"><input value={form.cittaResidenza} onChange={(e)=>setForm(f=>({ ...f, cittaResidenza: e.target.value }))} className="inp" /></Field>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <Field label="Colore Capelli"><input value={form.fisico.capelli} onChange={(e)=>setForm(f=>({ ...f, fisico: { ...f.fisico, capelli: e.target.value } }))} className="inp" /></Field>
          <Field label="Colore Occhi"><input value={form.fisico.occhi} onChange={(e)=>setForm(f=>({ ...f, fisico: { ...f.fisico, occhi: e.target.value } }))} className="inp" /></Field>
          <Field label="Altezza"><input value={form.fisico.altezza} onChange={(e)=>setForm(f=>({ ...f, fisico: { ...f.fisico, altezza: e.target.value } }))} className="inp" /></Field>
          <Field label="Peso"><input value={form.fisico.peso} onChange={(e)=>setForm(f=>({ ...f, fisico: { ...f.fisico, peso: e.target.value } }))} className="inp" /></Field>
          <Field label="Seno"><input value={form.fisico.seno} onChange={(e)=>setForm(f=>({ ...f, fisico: { ...f.fisico, seno: e.target.value } }))} className="inp" /></Field>
          <Field label="Vita"><input value={form.fisico.vita} onChange={(e)=>setForm(f=>({ ...f, fisico: { ...f.fisico, vita: e.target.value } }))} className="inp" /></Field>
          <Field label="Fianchi"><input value={form.fisico.fianchi} onChange={(e)=>setForm(f=>({ ...f, fisico: { ...f.fisico, fianchi: e.target.value } }))} className="inp" /></Field>
          <div className="flex items-center gap-4">
            <label className="text-sm text-gray-300 flex items-center gap-2"><input type="checkbox" checked={form.fisico.tatuaggi} onChange={(e)=>setForm(f=>({ ...f, fisico: { ...f.fisico, tatuaggi: e.target.checked } }))} /> Tatuaggi</label>
            <label className="text-sm text-gray-300 flex items-center gap-2"><input type="checkbox" checked={form.fisico.piercing} onChange={(e)=>setForm(f=>({ ...f, fisico: { ...f.fisico, piercing: e.target.checked } }))} /> Piercing</label>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-300">Biografia (IT)</label>
          <textarea value={form.bioIt} onChange={(e)=>setForm(f=>({ ...f, bioIt: e.target.value }))} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 min-h-[140px]"></textarea>
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>{saving? 'Salvo…':'Salva e continua'}</Button>
        </div>
      </div>

      <style jsx>{`
        .inp { background:#374151; border:1px solid #4b5563; color:#fff; border-radius:0.375rem; padding:0.5rem 0.75rem; }
      `}</style>
    </div>
  );
}

function Field({ label, children, className="" }: any){
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-sm text-gray-300">{label}</label>
      {children}
    </div>
  );
}
