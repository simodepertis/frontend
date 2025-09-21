"use client";

import SectionHeader from "@/components/SectionHeader";
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
  const [step, setStep] = useState(1); // 1..5
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

  const stepTitle = useMemo(() => ["", "Agenzia", "Lingue & Città", "Servizi", "Contatti", "Web & Social"][step], [step]);

  const completion = useMemo(() => {
    const checks = [
      data.name.trim().length >= 2,
      (data.languages?.length || 0) > 0 && (data.cities?.length || 0) > 0,
      (data.services?.length || 0) > 0,
      !!data.contacts.phone && !!data.contacts.email,
      !!data.website || !!data.socials?.instagram || !!data.socials?.twitter || !!data.socials?.telegram,
    ];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }, [data]);

  const next = () => setStep((s) => Math.min(5, s + 1));
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
      <SectionHeader title="Compila Profilo Agenzia" subtitle={`Step ${step}/5 — ${stepTitle}`} />

      <div className="rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <div className="font-semibold">Completamento profilo</div>
          <div className="text-neutral-600">{completion}%</div>
        </div>
        <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
          <div className="h-2 bg-green-500" style={{ width: `${completion}%` }} />
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 space-y-6">
        {loading && <div className="text-sm text-neutral-500">Caricamento dati…</div>}

        {step === 1 && (
          <section className="space-y-3">
            <div>
              <label className="block text-xs mb-1">Nome Agenzia*</label>
              <input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} className="border rounded-md px-3 py-2 w-full" />
            </div>
            <div>
              <label className="block text-xs mb-1">Descrizione</label>
              <textarea value={data.description} onChange={(e) => setData({ ...data, description: e.target.value })} className="border rounded-md px-3 py-2 w-full h-32" />
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4">
            <div>
              <div className="font-semibold mb-1">Lingue offerte</div>
              <div className="flex flex-wrap gap-2">
                {LANGS.map(l => (
                  <button key={l} onClick={() => setData({ ...data, languages: data.languages.includes(l) ? data.languages.filter(x => x !== l) : [...data.languages, l] })} className={`text-sm px-3 py-1 rounded-full border ${data.languages.includes(l) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-neutral-700'}`}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="font-semibold mb-1">Città servite</div>
              <CityEditor cities={data.cities} onChange={(cities) => setData({ ...data, cities })} />
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-3">
            <div className="font-semibold">Servizi</div>
            <div className="flex flex-wrap gap-2">
              {SERVICE_BANK.map(s => (
                <button key={s} onClick={() => setData({ ...data, services: data.services.includes(s) ? data.services.filter(x => x !== s) : [...data.services, s] })} className={`text-sm px-3 py-1 rounded-full border ${data.services.includes(s) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-neutral-700'}`}>{s}</button>
              ))}
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs mb-1">Prefisso</label>
              <input value={data.contacts.phoneCode} onChange={(e) => setData({ ...data, contacts: { ...data.contacts, phoneCode: e.target.value } })} className="border rounded-md px-3 py-2 w-full" />
            </div>
            <div>
              <label className="block text-xs mb-1">Telefono*</label>
              <input value={data.contacts.phone} onChange={(e) => setData({ ...data, contacts: { ...data.contacts, phone: e.target.value } })} className="border rounded-md px-3 py-2 w-full" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs mb-1">Email contatti*</label>
              <input type="email" value={data.contacts.email} onChange={(e) => setData({ ...data, contacts: { ...data.contacts, email: e.target.value } })} className="border rounded-md px-3 py-2 w-full" />
            </div>
          </section>
        )}

        {step === 5 && (
          <section className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-xs mb-1">Sito Web</label>
              <input value={data.website} onChange={(e) => setData({ ...data, website: e.target.value })} className="border rounded-md px-3 py-2 w-full" />
            </div>
            <div>
              <label className="block text-xs mb-1">Instagram</label>
              <input value={data.socials.instagram || ""} onChange={(e) => setData({ ...data, socials: { ...data.socials, instagram: e.target.value } })} className="border rounded-md px-3 py-2 w-full" />
            </div>
            <div>
              <label className="block text-xs mb-1">Twitter/X</label>
              <input value={data.socials.twitter || ""} onChange={(e) => setData({ ...data, socials: { ...data.socials, twitter: e.target.value } })} className="border rounded-md px-3 py-2 w-full" />
            </div>
            <div>
              <label className="block text-xs mb-1">Telegram</label>
              <input value={data.socials.telegram || ""} onChange={(e) => setData({ ...data, socials: { ...data.socials, telegram: e.target.value } })} className="border rounded-md px-3 py-2 w-full" />
            </div>
          </section>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex gap-2">
            <Button variant="secondary" onClick={saveAndExit} disabled={saving}>{saving ? 'Salvataggio…' : 'Salva bozza'}</Button>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={step === 1} onClick={prev}>Indietro</Button>
            {step < 5 ? (
              <Button onClick={async () => { await save(); next(); }}>{saving ? '...' : 'Avanti'}</Button>
            ) : (
              <Button onClick={publish} disabled={completion < 80}>Pubblica</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CityEditor({ cities, onChange }: { cities: string[]; onChange: (c: string[]) => void }) {
  const [draft, setDraft] = useState("");
  function add() {
    const v = draft.trim();
    if (!v) return;
    onChange([...(cities || []), v]);
    setDraft("");
  }
  function remove(idx: number) { onChange(cities.filter((_, i) => i !== idx)); }
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Aggiungi città" className="border rounded-md px-3 py-2" />
        <Button onClick={add}>Aggiungi</Button>
      </div>
      {(cities?.length || 0) > 0 && (
        <div className="flex flex-wrap gap-2">
          {cities.map((c, i) => (
            <span key={`${c}-${i}`} className="text-xs bg-neutral-100 border px-2 py-1 rounded-full">
              {c} <button className="ml-1" onClick={() => remove(i)}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
