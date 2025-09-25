"use client";

import SectionHeader from "@/components/SectionHeader";
import ITALIAN_CITIES from "@/lib/cities";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";

interface AgencyData {
  name: string;
  description: string;
  languages: string[];
  cities: string[];
  services: string[];
  contacts: { phoneCode: string; phone: string; email: string };
  website?: string;
  socials: { instagram?: string; twitter?: string; telegram?: string };
}

const DEFAULT: AgencyData = {
  name: "",
  description: "",
  languages: [],
  cities: [],
  services: [],
  contacts: { phoneCode: "+39", phone: "", email: "" },
  website: "",
  socials: {},
};

const LANGS = ["Italiano", "English", "Español", "Français", "Deutsch"];
const SERVICE_BANK = ["Accompagnamento", "Massaggi", "Eventi Privati", "VIP Service", "Viaggi"];

export default function AgencyOnboardingPage() {
  const [step, setStep] = useState(1); // 1..3
  const [data, setData] = useState<AgencyData>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // localStorage draft
  useEffect(() => {
    try {
      const raw = localStorage.getItem("agency-onboarding");
      if (raw) setData({ ...DEFAULT, ...JSON.parse(raw) });
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem("agency-onboarding", JSON.stringify(data)); } catch {}
  }, [data]);

  // Load from backend
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/agency/profile');
        if (res.ok) {
          const { profile } = await res.json();
          if (profile) {
            setData((prev) => ({
              ...prev,
              name: profile.name ?? prev.name,
              description: profile.description ?? prev.description,
              languages: profile.languages ?? prev.languages,
              cities: profile.cities ?? prev.cities,
              services: profile.services ?? prev.services,
              contacts: profile.contacts ?? prev.contacts,
              website: profile.website ?? prev.website,
              socials: profile.socials ?? prev.socials,
            }));
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stepTitle = useMemo(() => ["", "Info Agenzia", "Orari Di Lavoro", "Contatti"][step], [step]);

  const completion = useMemo(() => {
    const checks = [
      data.name.trim().length >= 2,
      (data.cities?.length || 0) > 0,
      !!data.contacts.phone && !!data.contacts.email,
    ];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }, [data]);

  const next = () => setStep((s) => Math.min(3, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/agency/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Errore salvataggio');
    } finally {
      setSaving(false);
    }
  }

  async function saveAndExit() {
    try { await save(); } catch {}
    alert('Bozza salvata');
    window.location.href = '/dashboard/agenzia';
  }

  async function publish() {
    try { await save(); } catch {}
    alert('Profilo Agenzia inviato. La moderazione verrà attivata in produzione.');
    window.location.href = '/dashboard/agenzia';
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Compila Profilo Agenzia" subtitle={`Step ${step}/3 — ${stepTitle}`} />

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <div className="font-semibold text-white">Completamento profilo</div>
          <div className="text-gray-400">{completion}%</div>
        </div>
        <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
          <div className="h-2 bg-green-500" style={{ width: `${completion}%` }} />
        </div>
      </div>

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 space-y-6 text-gray-300">
        {loading && <div className="text-sm text-gray-400">Caricamento dati…</div>}

        {step === 1 && (
          <section className="space-y-4">
            <div>
              <label className="block text-xs mb-1 text-gray-300">Nome Agenzia*</label>
              <input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} className="bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2 w-full placeholder-gray-400" />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1 text-gray-300">Paese</label>
                <select className="bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2 w-full" value={(data as any).country || 'Italia'} onChange={(e)=> setData({ ...data, cities: data.cities, languages: data.languages, services: data.services, contacts: data.contacts, website: data.website, socials: data.socials, ...( { country: e.target.value } as any) })}>
                  <option>Italia</option>
                  <option>Svizzera</option>
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1 text-gray-300">Città</label>
                <CityEditor cities={data.cities} onChange={(cities) => setData({ ...data, cities })} />
              </div>
            </div>
            <div>
              <label className="block text-xs mb-1 text-gray-300">Solo Lingua Italiana</label>
              <textarea value={data.description} onChange={(e) => setData({ ...data, description: e.target.value })} className="bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2 w-full h-32 placeholder-gray-400" />
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-3">
            <div>
              <label className="block text-xs mb-1 text-gray-300">Orari di lavoro (note)</label>
              <textarea placeholder="Es. Lun–Ven 10:00–19:00" value={(data as any)?.contacts?.schedule || ''} onChange={(e)=> setData({ ...data, contacts: { ...data.contacts, schedule: e.target.value } as any })} className="bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2 w-full h-28 placeholder-gray-400" />
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs mb-1 text-gray-300">Prefisso</label>
              <input value={data.contacts.phoneCode} onChange={(e) => setData({ ...data, contacts: { ...data.contacts, phoneCode: e.target.value } })} className="bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2 w-full placeholder-gray-400" />
            </div>
            <div>
              <label className="block text-xs mb-1 text-gray-300">Telefono*</label>
              <input value={data.contacts.phone} onChange={(e) => setData({ ...data, contacts: { ...data.contacts, phone: e.target.value } })} className="bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2 w-full placeholder-gray-400" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs mb-1 text-gray-300">Email contatti*</label>
              <input type="email" value={data.contacts.email} onChange={(e) => setData({ ...data, contacts: { ...data.contacts, email: e.target.value } })} className="bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2 w-full placeholder-gray-400" />
            </div>
          </section>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex gap-2">
            <Button variant="secondary" onClick={saveAndExit} disabled={saving}>{saving ? 'Salvataggio…' : 'Salva bozza'}</Button>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={step === 1} onClick={prev}>Indietro</Button>
            {step < 3 ? (
              <Button onClick={async () => { await save(); next(); }}>{saving ? '...' : 'Avanti'}</Button>
            ) : (
              <Button onClick={publish} disabled={completion < 67}>Pubblica</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CityEditor({ cities, onChange }: { cities: string[]; onChange: (c: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const [sel, setSel] = useState("");
  function add(value?: string) {
    const v = (value ?? draft).trim();
    if (!v) return;
    onChange([...(cities || []), v]);
    setDraft("");
    setSel("");
  }
  function remove(idx: number) { onChange(cities.filter((_, i) => i !== idx)); }
  return (
    <div className="space-y-2">
      <div className="grid md:grid-cols-[1fr,auto] gap-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <select value={sel} onChange={(e)=> setSel(e.target.value)} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2">
            <option value="">Seleziona città</option>
            {ITALIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="…o inserisci manualmente" className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => add(sel || draft)} disabled={!sel && !draft}>Aggiungi</Button>
        </div>
      </div>
      {(cities?.length || 0) > 0 && (
        <div className="flex flex-wrap gap-2">
          {cities.map((c, i) => (
            <span key={`${c}-${i}`} className="text-xs bg-gray-800 text-gray-200 border border-gray-600 px-2 py-1 rounded-full">
              {c} <button className="ml-1 text-gray-400 hover:text-red-400" onClick={() => remove(i)}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
