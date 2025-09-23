"use client";

import SectionHeader from "@/components/SectionHeader";
import ITALIAN_CITIES from "@/lib/cities";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";

// Tipi semplici per demo (salvati in localStorage)
interface OnboardingData {
  bioIt: string;
  bioEn: string;
  languages: { lang: string; level: string }[];
  cities: { base?: string; second?: string; third?: string; cap?: string; incall?: boolean; outcall?: boolean };
  services: {
    orientation?: string;
    for: { women: boolean; men: boolean; couples: boolean; trans: boolean; gays: boolean; group: boolean };
    categories: { general: string[]; extra: string[]; fetish: string[]; virtual: string[] };
    notes?: string;
  };
  rates: {
    incall: { duration: string; price: number }[];
    outcall: { duration: string; price: number }[];
  };
  contacts: {
    phoneCode: string;
    phone: string;
    bookingEmail?: string;
    website?: string;
    address?: string;
  };
}

const defaultData: OnboardingData = {
  bioIt: "",
  bioEn: "",
  languages: [],
  cities: { base: "", second: "", third: "", cap: "", incall: true, outcall: true },
  services: {
    orientation: "",
    for: { women: true, men: true, couples: false, trans: false, gays: false, group: false },
    categories: { general: [], extra: [], fetish: [], virtual: [] },
    notes: "",
  },
  rates: { incall: [], outcall: [] },
  contacts: { phoneCode: "+39", phone: "", bookingEmail: "", website: "", address: "" },
};

const LANGS = ["Italiano", "English", "Español", "Français", "Deutsch"];
const LEVELS = ["Base", "Buono", "Fluente", "Eccellente / Nativo"];
const DURATIONS = ["30 min", "1 ora", "2 ore", "Notte"];
const GENERAL_SERVICES = ["Massaggio", "Doccia insieme", "Baci", "Foto/Video consensuali"];
const EXTRA_SERVICES = ["GFE", "Striptease", "Roleplay", "Dress code"];
const FETISH_SERVICES = ["Light BDSM", "Foot fetish", "Domination", "Submission"];

export default function EscortOnboardingPage() {
  const [step, setStep] = useState(1); // 1..6
  const [data, setData] = useState<OnboardingData>(defaultData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [okMsg, setOkMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [lastErrorAt, setLastErrorAt] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);

  // Carica/salva bozza su localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("escort-onboarding");
      if (raw) setData({ ...defaultData, ...JSON.parse(raw) });
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem("escort-onboarding", JSON.stringify(data)); } catch {}
    if (!loading) setDirty(true);
    // Pulisco eventuali error vecchi quando l'utente modifica
    setErrMsg(""); setOkMsg("");
  }, [data]);

  // Autosave every 20s if there are unsaved changes
  useEffect(() => {
    if (loading) return;
    const id = setInterval(async () => {
      if (dirty && !saving) {
        try { await saveToServer(true); setDirty(false); } catch {}
      }
    }, 20000);
    return () => clearInterval(id);
  }, [dirty, saving, loading]);

  // Carica bozza dal server (se esiste)
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('auth-token');
        const res = await fetch('/api/me/profile', { headers: token ? { 'Authorization': `Bearer ${token}` } : undefined });
        if (res.ok) {
          const { profile } = await res.json();
          if (profile) {
            setData((prev) => ({
              ...prev,
              bioIt: profile.bioIt ?? prev.bioIt,
              bioEn: profile.bioEn ?? prev.bioEn,
              languages: profile.languages ?? prev.languages,
              cities: profile.cities ?? prev.cities,
              services: profile.services ?? prev.services,
              rates: profile.rates ?? prev.rates,
              contacts: profile.contacts ?? prev.contacts,
            }));
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const next = () => { setStep((s) => Math.min(6, s + 1)); setErrMsg(""); setOkMsg(""); };
  const prev = () => { setStep((s) => Math.max(1, s - 1)); setErrMsg(""); setOkMsg(""); };

  const stepTitle = useMemo(() => {
    return ["", "Su di me", "Lingue", "Città di lavoro", "Servizi", "Tariffe", "Contatti"][step];
  }, [step]);

  // Validazioni minime per ogni step
  const stepValid = useMemo(() => {
    switch (step) {
      case 1:
        return (data.bioIt?.trim().length || 0) >= 200; // almeno 200 caratteri
      case 2:
        return Array.isArray(data.languages) && data.languages.length > 0;
      case 3:
        return !!data.cities.base && !!data.cities.cap; // base + CAP
      case 4:
        // almeno una delle categorie o un target selezionato
        const anyTarget = Object.values(data.services.for || {}).some(Boolean);
        const anyCategory = [
          ...(data.services.categories.general || []),
          ...(data.services.categories.extra || []),
          ...(data.services.categories.fetish || []),
          ...(data.services.categories.virtual || []),
        ].length > 0;
        return anyTarget || anyCategory;
      case 5:
        return (data.rates.incall?.length || 0) + (data.rates.outcall?.length || 0) > 0;
      case 6:
        return !!data.contacts.phone && data.contacts.phone.trim().length >= 6;
      default:
        return true;
    }
  }, [step, data]);

  const completionPercent = useMemo(() => {
    const checks = [
      (data.bioIt?.trim().length || 0) >= 200,
      Array.isArray(data.languages) && data.languages.length > 0,
      !!data.cities.base && !!data.cities.cap,
      (Object.values(data.services.for || {}).some(Boolean)) || ([
        ...(data.services.categories.general || []),
        ...(data.services.categories.extra || []),
        ...(data.services.categories.fetish || []),
        ...(data.services.categories.virtual || []),
      ].length > 0),
      (data.rates.incall?.length || 0) + (data.rates.outcall?.length || 0) > 0,
      !!data.contacts.phone && data.contacts.phone.trim().length >= 6,
    ];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }, [data]);

  const saveToServer = async (silent: boolean = false) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('auth-token');
      const res = await fetch('/api/me/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Salvataggio fallito');
      }
      setOkMsg('Bozza salvata.'); setErrMsg(""); setLastErrorAt(null);
    } catch (e: any) {
      if (!silent) {
        const msg = e?.message || 'Errore salvataggio';
        setErrMsg(msg);
        setLastErrorAt(Date.now());
      } else {
        // in autosave non disturbiamo l'utente
        console.warn('Autosave failed:', e);
      }
    } finally {
      setSaving(false);
    }
  };

  // Nasconde automaticamente l'errore dopo 4 secondi
  useEffect(() => {
    if (!errMsg) return;
    const id = setTimeout(() => { setErrMsg(""); }, 4000);
    return () => clearTimeout(id);
  }, [errMsg]);

  const saveAndExit = async () => {
    try { await saveToServer(); setOkMsg('Bozza salvata. Potrai riprendere in qualsiasi momento.'); setErrMsg("");
      setTimeout(()=>{ window.location.href = "/dashboard"; }, 600);
    } catch (e:any) { setErrMsg(e?.message || 'Errore salvataggio'); setOkMsg(""); }
  };

  const publish = async () => {
    try { 
      await saveToServer(); 
      
      // Set consent to trigger admin approval workflow
      const token = localStorage.getItem('auth-token');
      if (token) {
        console.log('📝 Impostando consenso per approvazione admin...');
        const response = await fetch('/api/escort/consent', {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ Consenso impostato:', result);
          setOkMsg("Profilo inviato per moderazione. Riceverai conferma una volta approvato dall'amministratore."); setErrMsg("");
          setTimeout(()=>{ window.location.href = "/dashboard"; }, 800);
        } else {
          console.error('❌ Errore impostazione consenso:', response.status);
          setErrMsg('Errore nell\'invio per moderazione. Riprova.'); setOkMsg("");
        }
      }
    } catch (error) {
      console.error('❌ Errore pubblicazione profilo:', error);
      setErrMsg('Errore: ' + error); setOkMsg("");
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title={`Compila Profilo Escort`} subtitle={`Step ${step}/6 — ${stepTitle}`} />
      {/* Barra avanzamento */}
      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <div className="font-semibold text-white">Completamento profilo</div>
          <div className="text-gray-400">{completionPercent}%</div>
        </div>
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-2 bg-green-500" style={{ width: `${completionPercent}%` }} />
        </div>
      </div>

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 space-y-6">
        {okMsg && (<div className="rounded-md border border-green-700 bg-green-900/40 text-green-200 px-3 py-2">{okMsg}</div>)}
        {errMsg && (<div className="rounded-md border border-red-700 bg-red-900/40 text-red-200 px-3 py-2">{errMsg}</div>)}
        {loading && <div className="text-sm text-gray-400">Caricamento dati dal server…</div>}
        {step === 1 && (
          <section>
            <h3 className="font-semibold mb-2 text-white">Su di me</h3>
            <p className="text-sm text-gray-400 mb-3">Scrivi almeno 200 caratteri in italiano. Puoi aggiungere anche una descrizione in inglese.</p>
            <div className="grid gap-3">
              <div>
                <label className="block text-xs mb-1 text-white">Solo Lingua Italiana*</label>
                <textarea value={data.bioIt} onChange={(e) => setData({ ...data, bioIt: e.target.value })} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 h-40 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="text-xs text-gray-400 mt-1">{data.bioIt.length} / 3000</div>
              </div>
              <div>
                <label className="block text-xs mb-1 text-white">Solo Lingua Inglese</label>
                <textarea value={data.bioEn} onChange={(e) => setData({ ...data, bioEn: e.target.value })} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="text-xs text-gray-400 mt-1">{data.bioEn.length} / 3000</div>
              </div>
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <h3 className="font-semibold mb-2 text-white">Lingue</h3>
            <p className="text-sm text-gray-400 mb-3">Seleziona lingua e livello, poi premi “+”.</p>
            <LangAdder data={data} setData={setData} />
          </section>
        )}

        {step === 3 && (
          <section>
            <h3 className="font-semibold mb-2 text-white">Città di lavoro</h3>
            <p className="text-sm text-gray-400 mb-3">Imposta la città base e opzionalmente altre città. Specifica CAP e disponibilità.</p>
            <div className="grid gap-3 max-w-xl">
              <select value={data.cities.base} onChange={(e) => setData({ ...data, cities: { ...data.cities, base: e.target.value } })} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2">
                <option value="">Città Base</option>
                {ITALIAN_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select value={data.cities.second} onChange={(e) => setData({ ...data, cities: { ...data.cities, second: e.target.value } })} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2">
                  <option value="">Seconda città</option>
                  {ITALIAN_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select value={data.cities.third} onChange={(e) => setData({ ...data, cities: { ...data.cities, third: e.target.value } })} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2">
                  <option value="">Terza città</option>
                  {ITALIAN_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input value={data.cities.cap} onChange={(e) => setData({ ...data, cities: { ...data.cities, cap: e.target.value } })} placeholder="CAP" className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" />
                <div className="flex items-center gap-4 text-sm">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={!!data.cities.incall} onChange={(e) => setData({ ...data, cities: { ...data.cities, incall: e.target.checked } })} /> Incall</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={!!data.cities.outcall} onChange={(e) => setData({ ...data, cities: { ...data.cities, outcall: e.target.checked } })} /> Outcall</label>
                </div>
              </div>
            </div>
          </section>
        )}

        {step === 4 && (
          <section>
            <h3 className="font-semibold mb-2 text-white">Servizi</h3>
            <div className="grid gap-4 max-w-3xl">
              <div>
                <label className="block text-xs mb-1 text-white">Orientamento Sessuale</label>
                <select value={data.services.orientation} onChange={(e) => setData({ ...data, services: { ...data.services, orientation: e.target.value } })} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2">
                  <option value="">Orientamento Sessuale</option>
                  <option>Eterosessuale</option>
                  <option>Bisessuale</option>
                  <option>Omosessuale</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                {(
                  [
                    { key: "women", label: "Donne" },
                    { key: "men", label: "Uomini" },
                    { key: "couples", label: "Coppie" },
                    { key: "trans", label: "Trans" },
                    { key: "gays", label: "Gays" },
                    { key: "group", label: "2+" },
                  ] as const
                ).map((o) => (
                  <label key={o.key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(data.services.for as any)[o.key]}
                      onChange={(e) => setData({ ...data, services: { ...data.services, for: { ...data.services.for, [o.key]: e.target.checked } } })}
                    />
                    {o.label}
                  </label>
                ))}
              </div>

              <ServiceGroup
                title="Servizi Generali"
                options={GENERAL_SERVICES}
                selected={data.services.categories.general}
                onChange={(arr) => setData({ ...data, services: { ...data.services, categories: { ...data.services.categories, general: arr } } })}
              />
              <ServiceGroup
                title="Servizi Extra"
                options={EXTRA_SERVICES}
                selected={data.services.categories.extra}
                onChange={(arr) => setData({ ...data, services: { ...data.services, categories: { ...data.services.categories, extra: arr } } })}
              />
              <ServiceGroup
                title="Feticismo / Bizzarro"
                options={FETISH_SERVICES}
                selected={data.services.categories.fetish}
                onChange={(arr) => setData({ ...data, services: { ...data.services, categories: { ...data.services.categories, fetish: arr } } })}
              />

              <div>
                <label className="block text-xs mb-1">Servizi Aggiuntivi (note)</label>
                <textarea value={data.services.notes} onChange={(e) => setData({ ...data, services: { ...data.services, notes: e.target.value } })} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24" />
              </div>
            </div>
          </section>
        )}

        {step === 5 && (
          <section>
            <h3 className="font-semibold mb-2 text-white">Tariffe</h3>
            <p className="text-sm text-gray-400 mb-3">Seleziona durata e prezzo, poi premi “+”. Le tariffe aggiunte appariranno nella lista.</p>
            <RateAdder
              label="Tariffe Incall"
              items={data.rates.incall}
              onChange={(items) => setData({ ...data, rates: { ...data.rates, incall: items } })}
            />
            <div className="h-4" />
            <RateAdder
              label="Tariffe Outcall"
              items={data.rates.outcall}
              onChange={(items) => setData({ ...data, rates: { ...data.rates, outcall: items } })}
            />
          </section>
        )}

        {step === 6 && (
          <section>
            <h3 className="font-semibold mb-2 text-white">Contatti</h3>
            <p className="text-sm text-gray-400 mb-3">Indica un numero valido (verifica in futuro) e i recapiti di prenotazione.</p>
            <div className="grid gap-3 max-w-xl">
              <div className="grid grid-cols-[140px,1fr] gap-2">
                <select value={data.contacts.phoneCode} onChange={(e) => setData({ ...data, contacts: { ...data.contacts, phoneCode: e.target.value } })} className="border rounded-md px-3 py-2">
                  <option value="+39">Italy (+39)</option>
                  <option value="+41">Switzerland (+41)</option>
                  <option value="+43">Austria (+43)</option>
                </select>
                <input value={data.contacts.phone} onChange={(e) => setData({ ...data, contacts: { ...data.contacts, phone: e.target.value } })} placeholder="Numero di Telefono" className="border rounded-md px-3 py-2" />
              </div>
              <input value={data.contacts.bookingEmail} onChange={(e) => setData({ ...data, contacts: { ...data.contacts, bookingEmail: e.target.value } })} placeholder="E-mail di Prenotazione" className="border rounded-md px-3 py-2" />
              <input value={data.contacts.website} onChange={(e) => setData({ ...data, contacts: { ...data.contacts, website: e.target.value } })} placeholder="Sito Web / URL" className="border rounded-md px-3 py-2" />
              <input value={data.contacts.address} onChange={(e) => setData({ ...data, contacts: { ...data.contacts, address: e.target.value } })} placeholder="Dettagli Indirizzo (facoltativo)" className="border rounded-md px-3 py-2" />
            </div>
          </section>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex gap-2">
            <Button variant="secondary" onClick={saveAndExit} disabled={saving}>{saving ? 'Salvataggio…' : 'Salva bozza'}</Button>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={step === 1} onClick={prev}>Indietro</Button>
            {step < 6 ? (
              <Button onClick={async () => { try { await saveToServer(false); next(); } catch (e:any) { setErrMsg(e?.message || 'Errore salvataggio'); setOkMsg(''); } }} disabled={!stepValid}>
                {stepValid ? (saving ? '...' : 'Avanti') : 'Completa campi richiesti'}
              </Button>
            ) : (
              <Button onClick={publish} disabled={completionPercent < 80}>Pubblica</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LangAdder({ data, setData }: { data: OnboardingData; setData: (d: OnboardingData) => void }) {
  const [lang, setLang] = useState("");
  const [level, setLevel] = useState("");
  const add = () => {
    if (!lang || !level) return;
    setData({ ...data, languages: [{ lang, level }, ...data.languages.filter(l => l.lang !== lang)] });
    setLang(""); setLevel("");
  };
  const remove = (l: string) => setData({ ...data, languages: data.languages.filter(x => x.lang !== l) });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-3xl">
        <select value={lang} onChange={(e) => setLang(e.target.value)} className="border rounded-md px-3 py-2">
          <option value="">Lingue*</option>
          {LANGS.map((l) => (<option key={l}>{l}</option>))}
        </select>
        <select value={level} onChange={(e) => setLevel(e.target.value)} className="border rounded-md px-3 py-2">
          <option value="">Competenza*</option>
          {LEVELS.map((l) => (<option key={l}>{l}</option>))}
        </select>
        <Button onClick={add}>＋</Button>
      </div>
      <ul className="text-sm text-neutral-700 space-y-1">
        {data.languages.map((l) => (
          <li key={l.lang} className="flex items-center justify-between border rounded-md px-3 py-2">
            <span>{l.lang} — {l.level}</span>
            <button className="text-neutral-500 hover:text-red-600" onClick={() => remove(l.lang)}>×</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ServiceGroup({ title, options, selected, onChange }: { title: string; options: string[]; selected: string[]; onChange: (arr: string[]) => void }) {
  const toggle = (opt: string, checked: boolean) => {
    if (checked) onChange([...selected, opt]);
    else onChange(selected.filter((x) => x !== opt));
  };
  return (
    <div>
      <div className="font-semibold mb-2 text-white">{title} <span className="text-xs text-gray-400">({selected.length}/{options.length})</span></div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-300">
        {options.map((o) => (
          <label key={o} className="inline-flex items-center gap-2">
            <input type="checkbox" checked={selected.includes(o)} onChange={(e) => toggle(o, e.target.checked)} />
            <span className="text-gray-300">{o}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function RateAdder({ label, items, onChange }: { label: string; items: { duration: string; price: number }[]; onChange: (arr: { duration: string; price: number }[]) => void }) {
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");
  const add = () => {
    const p = Number(price);
    if (!duration || !Number.isFinite(p)) return;
    onChange([{ duration, price: p }, ...items.filter((i) => i.duration !== duration)]);
    setDuration(""); setPrice("");
  };
  const remove = (d: string) => onChange(items.filter(i => i.duration !== d));
  return (
    <div className="border border-gray-600 rounded-md p-3 bg-gray-900">
      <div className="mb-3 font-semibold text-white">{label}</div>
      <div className="grid grid-cols-1 md:grid-cols-[1fr,1fr,auto] gap-3 max-w-2xl">
        <select value={duration} onChange={(e) => setDuration(e.target.value)} className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2">
          <option value="">Scegli durata</option>
          {DURATIONS.map((d) => (<option key={d}>{d}</option>))}
        </select>
        <div className="grid grid-cols-[1fr,auto] gap-2">
          <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Prezzo" className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" />
          <div className="self-center text-gray-300">EUR</div>
        </div>
        <Button onClick={add}>＋</Button>
      </div>

      <ul className="mt-3 text-sm text-gray-300 space-y-1">
        {items.length === 0 && <li className="text-gray-400">Non ci sono tariffe definite</li>}
        {items.map((i) => (
          <li key={i.duration} className="flex items-center justify-between border border-gray-600 rounded-md px-3 py-2 bg-gray-800">
            <span className="text-white">{i.duration}</span>
            <span className="font-semibold text-white">€ {i.price}</span>
            <button className="text-gray-400 hover:text-red-400" onClick={() => remove(i.duration)}>×</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
