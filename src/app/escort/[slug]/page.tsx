"use client";

// Use native <img> to avoid optimizer issues with runtime uploads
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import SectionHeader from "@/components/SectionHeader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot, faBirthdayCake, faEuroSign, faShieldHeart, faStar, faComments } from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp, faTelegram, faViber } from "@fortawesome/free-brands-svg-icons";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { SERVICE_GROUPS } from "@/data/services";

export default function EscortDetailPage() {
  type EscortView = {
    slug: string;
    nome: string;
    eta: number;
    citta: string;
    prezzo: number;
    descrizione: string;
    foto: string[];
    tier?: string;
    tierExpiresAt?: string | null;
    girlOfTheDay?: boolean;
  };
  const params = useParams();
  const slug = String((params as any)?.slug || "");
  const [data, setData] = useState<any | null>(null);
  const [me, setMe] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const escort: EscortView = useMemo<EscortView>(() => {
    const fallback: EscortView = {
      slug,
      nome: slug.split("-")[0]?.toUpperCase() || "Modella",
      eta: 25,
      citta: "Milano",
      prezzo: 150,
      descrizione: "",
      foto: ["/placeholder.svg"],
      tier: undefined,
      tierExpiresAt: null,
      girlOfTheDay: false,
    };
    if (!data) return fallback;
    return {
      ...fallback,
      nome: data.nome || fallback.nome,
      // Support both legacy array and new object shape for cities
      citta: (() => {
        try {
          if (Array.isArray((data as any)?.cities) && (data as any).cities.length) {
            return String((data as any).cities[0]);
          }
          const c = (data as any)?.cities || {};
          return c.baseCity || c.base || c.city || fallback.citta;
        } catch { return fallback.citta; }
      })(),
      foto: Array.isArray(data.photos) && data.photos.length ? data.photos : [data.coverUrl || '/placeholder.svg'],
      prezzo: (() => {
        try {
          const rates: any = (data as any)?.rates;
          // If object map: try common keys, then min value
          const prefer = ['hour_1','hour1','1h','60','mezzora','30'];
          if (rates && typeof rates === 'object' && !Array.isArray(rates)) {
            for (const k of prefer) {
              const v = rates[k];
              const num = typeof v === 'number' ? v : (typeof v === 'string' ? Number(String(v).replace(/[^0-9]/g,'')) : NaN);
              if (!Number.isNaN(num) && num > 0) return num;
            }
            let min: number | null = null;
            for (const v of Object.values(rates)) {
              const num = typeof v === 'number' ? v : (typeof v === 'string' ? Number(String(v).replace(/[^0-9]/g,'')) : NaN);
              if (!Number.isNaN(num) && num > 0) min = min === null ? num : Math.min(min, num);
            }
            if (min !== null) return min;
          }
          // If array: pick first price
          if (Array.isArray(rates) && rates.length) {
            const first = rates.find((x:any)=> typeof x?.price === 'number') || rates[0];
            const num = typeof first?.price === 'number' ? first.price : Number(String(first?.price||'').replace(/[^0-9]/g,''));
            if (!Number.isNaN(num) && num > 0) return num;
          }
        } catch {}
        return fallback.prezzo;
      })(),
      descrizione: typeof (data as any)?.bio === 'string' ? (data as any).bio : "",
      tier: data.tier,
      tierExpiresAt: data.tierExpiresAt,
      girlOfTheDay: data.girlOfTheDay,
    };
  }, [data, slug]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/public/escort/${slug}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
        // fetch current user for owner-only actions
        try {
          const meRes = await fetch('/api/user/me');
          if (meRes.ok) { const j = await meRes.json(); setMe(j?.user || null); }
        } catch {}
      } finally { setLoading(false); }
    })();
  }, [slug]);

  const [active, setActive] = useState(0);
  const [tab, setTab] = useState<string>("descrizione");
  const [reviews, setReviews] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [revTitle, setRevTitle] = useState("");
  const [revRating, setRevRating] = useState<number>(5);
  const [revBody, setRevBody] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [submittingRev, setSubmittingRev] = useState(false);
  const [submittingCom, setSubmittingCom] = useState(false);
  const [showReportProblem, setShowReportProblem] = useState(false);
  const [reportMsg, setReportMsg] = useState("");
  const [showReportPhoto, setShowReportPhoto] = useState(false);
  const [reportPhotoUrl, setReportPhotoUrl] = useState<string>("");
  const [reportReason, setReportReason] = useState<string>("");

  // Leaflet map for public profile (load via CDN to avoid deps)
  const [leafletReady, setLeafletReady] = useState(false);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Helper to load leaflet
  function loadLeafletFromCDN(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') return reject(new Error('SSR'));
      const w: any = window as any;
      if (w.L) return resolve(w.L);
      const cssId = 'leaflet-css';
      if (!document.getElementById(cssId)) {
        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      const jsId = 'leaflet-js';
      if (!document.getElementById(jsId)) {
        const s = document.createElement('script');
        s.id = jsId;
        s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        s.async = true;
        s.onload = () => {
          try {
            const L = (window as any).L;
            L.Icon.Default.mergeOptions({
              iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
              shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });
            resolve(L);
          } catch (e) { reject(e); }
        };
        s.onerror = () => reject(new Error('Leaflet load failed'));
        document.body.appendChild(s);
      } else {
        const iv = setInterval(() => { if ((window as any).L) { clearInterval(iv); resolve((window as any).L); } }, 50);
        setTimeout(() => { clearInterval(iv); reject(new Error('Leaflet not available')); }, 5000);
      }
    });
  }

  // Prepara mappa key -> etichetta servizi
  const serviceLabel = useMemo<Record<string,string>>(()=>{
    const m: Record<string,string> = {};
    try { SERVICE_GROUPS.forEach(g => g.items.forEach(i => { m[i.key] = i.label; })); } catch {}
    return m;
  }, []);

  // Normalize services to array<string>
  const servicesList = useMemo<string[]>(() => {
    const raw = (data as any)?.services;
    if (!raw) return [];
    try {
      if (Array.isArray(raw)) {
        // Could be array of strings or objects
        return raw.map((it:any) => typeof it === 'string' ? it : (it?.label || it?.name || JSON.stringify(it)) ).filter(Boolean);
      }
      if (typeof raw === 'object') {
        // Support wizard shape e forma dashboard { key: { enabled, price } }
        const out: string[] = [];
        // 1) Forma dashboard: { key: { enabled: true, price?: number } }
        try {
          const enabledKeys = Object.keys(raw).filter((k) => !!(raw as any)?.[k] && typeof (raw as any)[k] === 'object' && !!(raw as any)[k]?.enabled);
          if (enabledKeys.length) {
            out.push(...enabledKeys.map((k) => serviceLabel[k] || k));
          }
        } catch {}
        if (raw.categories && typeof raw.categories === 'object') {
          const cat = raw.categories as any;
          ['general','extra','fetish','virtual'].forEach((k) => {
            if (Array.isArray(cat?.[k])) out.push(...cat[k].map((s:any)=> String(s)));
          });
        }
        if (raw.for && typeof raw.for === 'object') {
          // Map targets to human labels
          const map: Record<string,string> = { women: 'Donne', men: 'Uomini', couples: 'Coppie', trans: 'Trans', gays: 'Gays', group: 'Gruppi / 2+' };
          Object.keys(raw.for).forEach((k) => { if (raw.for[k]) out.push(map[k] || k); });
        }
        if (raw.orientation) out.push(String(raw.orientation));
        if (raw.notes && String(raw.notes).trim()) out.push(String(raw.notes));
        // Also support flat boolean map fallback: { serviceName: true }
        const flat = Object.keys(raw).filter((k)=> typeof raw[k] === 'boolean' && raw[k]).map((k)=>k);
        out.push(...flat);
        return out.filter(Boolean);
      }
      if (typeof raw === 'string') {
        // Comma separated fallback
        return raw.split(',').map((s)=>s.trim()).filter(Boolean);
      }
    } catch {}
    return [];
  }, [data]);

  // Normalize rates for display: support array or {incall,outcall}
  const ratesList = useMemo<any[]>(() => {
    const raw = (data as any)?.rates;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'object') {
      const out: any[] = [];
      if (Array.isArray(raw.incall)) {
        out.push(...raw.incall.map((r: any) => ({ ...r, label: r?.label || `Incall ${r?.duration || ''}`.trim() })));
      }
      if (Array.isArray(raw.outcall)) {
        out.push(...raw.outcall.map((r: any) => ({ ...r, label: r?.label || `Outcall ${r?.duration || ''}`.trim() })));
      }
      return out;
    }
    return [];
  }, [data]);

  const countdown = useMemo(() => {
    if (!escort.tierExpiresAt) return null;
    const end = new Date(escort.tierExpiresAt).getTime();
    const now = Date.now();
    const diff = end - now;
    if (diff <= 0) return "scaduto";
    const days = Math.floor(diff / (1000*60*60*24));
    const hours = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
    return days > 0 ? `${days}g ${hours}h` : `${hours}h`;
  }, [escort.tierExpiresAt]);

  const tierClasses = useMemo(() => {
    switch (escort.tier) {
      case 'VIP':
        return 'bg-yellow-400 text-black';
      case 'TITANIO':
        return 'bg-sky-700 text-white';
      case 'ORO':
        return 'bg-amber-300 text-black';
      case 'ARGENTO':
        return 'bg-zinc-300 text-neutral-900';
      default:
        return 'bg-neutral-200 text-neutral-800';
    }
  }, [escort.tier]);

  const tierClass = useMemo(() => {
    const t = escort.tier;
    switch (t) {
      case 'VIP': return 'bg-yellow-300 text-black border-yellow-400';
      case 'TITANIO': return 'bg-blue-700 text-white border-blue-800';
      case 'ORO': return 'bg-amber-400 text-black border-amber-500';
      case 'ARGENTO': return 'bg-gray-300 text-gray-900 border-gray-400';
      default: return 'bg-neutral-200 text-neutral-800 border-neutral-300';
    }
  }, [ escort.tier ]);

  // Load public reviews and comments for this profile
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/API/public/recensioni/${slug}`);
        if (r.ok) { const j = await r.json(); setReviews(j.items || []); }
      } catch {}
      try {
        const c = await fetch(`/API/public/commenti/${slug}`);
        if (c.ok) { const j = await c.json(); setComments(j.items || []); }
      } catch {}
    })();
  }, [slug]);

  async function submitReview() {
    if (!data?.userId) { alert('Profilo non caricato'); return; }
    setSubmittingRev(true);
    try {
      const res = await fetch('/API/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetUserId: data.userId, rating: revRating, title: revTitle, body: revBody }) });
      const j = await res.json();
      if (res.status === 401) { window.location.href = `/autenticazione?redirect=/escort/${slug}`; return; }
      if (!res.ok) { alert(j?.error || 'Errore invio recensione'); return; }
      // In dev viene approvata: ricarico lista
      try { const r = await fetch(`/API/public/recensioni/${slug}`); if (r.ok) { const jr = await r.json(); setReviews(jr.items || []); } } catch {}
      setRevTitle(""); setRevBody(""); setRevRating(5);
    } finally { setSubmittingRev(false); }
  }

  async function submitComment() {
    if (!data?.userId) { alert('Profilo non caricato'); return; }
    setSubmittingCom(true);
    try {
      const res = await fetch('/API/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetUserId: data.userId, body: commentBody }) });
      const j = await res.json();
      if (res.status === 401) { window.location.href = `/autenticazione?redirect=/escort/${slug}`; return; }
      if (!res.ok) { alert(j?.error || 'Errore invio commento'); return; }
      try { const c = await fetch(`/API/public/commenti/${slug}`); if (c.ok) { const jc = await c.json(); setComments(jc.items || []); } } catch {}
      setCommentBody("");
    } finally { setSubmittingCom(false); }
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Escort", href: "/escort" }, { label: escort.nome }]} />
      <SectionHeader title={`${escort.nome}, ${escort.eta}`} subtitle={`Profilo a ${escort.citta}`} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-2">
        {/* Galleria */}
        <div className="md:col-span-2 bg-gray-800 rounded-xl border shadow-sm p-4">
          <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden">
            <img
              src={escort.foto[active] || '/placeholder.svg'}
              alt={`${escort.nome} principale`}
              className="object-cover absolute inset-0 w-full h-full"
              onError={(e)=>{ const t=e.currentTarget; if (t.src.indexOf('/placeholder.svg')===-1) t.src='/placeholder.svg'; }}
            />
            {escort.girlOfTheDay && (
              <div className="absolute top-3 right-3 rotate-3">
                <span className="bg-rose-600 text-white text-xs font-semibold px-3 py-1 rounded-md shadow">
                  Ragazza del Giorno
                </span>
              </div>
            )}
          </div>
          <div className="mt-3 grid grid-cols-4 sm:grid-cols-6 gap-2">
            {escort.foto.map((src, idx) => (
              <button
                key={idx}
                onClick={() => setActive(idx)}
                className={`relative w-full aspect-square rounded-md overflow-hidden border ${active === idx ? 'ring-2 ring-blue-500' : 'border-neutral-200'}`}
              >
                <img
                  src={src || '/placeholder.svg'}
                  alt={`${escort.nome} thumb ${idx+1}`}
                  className="object-cover absolute inset-0 w-full h-full"
                  onError={(e)=>{ const t=e.currentTarget; if (t.src.indexOf('/placeholder.svg')===-1) t.src='/placeholder.svg'; }}
                />
              </button>
            ))}
          </div>

          {/* Contatti sintetici sotto galleria */}
          {data?.contacts?.phone && (
            <div className="mt-4 border border-gray-700 bg-gray-900 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-blue-400"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.05-.24c1.12.37 2.33.57 3.54.57a1 1 0 011 1V21a1 1 0 01-1 1C10.85 22 2 13.15 2 2a1 1 0 011-1h3.5a1 1 0 011 1c0 1.21.2 2.42.57 3.54a1 1 0 01-.24 1.05l-2.2 2.2z"/></svg>
                <a href={`tel:${data.contacts.phone}`} className="hover:underline">{data.contacts.phone}</a>
              </div>
              <div className="flex items-center gap-2">
                {Array.isArray(data.contacts.apps) && data.contacts.apps.includes('whatsapp') && (
                  <a href={`https://wa.me/${String(data.contacts.phone).replace(/\D/g,'')}`} target="_blank" className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md px-3 py-1.5 text-sm">
                    <FontAwesomeIcon icon={faWhatsapp} /> WhatsApp
                  </a>
                )}
                {/* Telegram (prefer username/link if provided) */}
                {((Array.isArray(data.contacts.apps) && data.contacts.apps.includes('telegram')) || data.contacts.telegram) && (
                  (() => {
                    const raw = String(data.contacts.telegram || '').trim();
                    const isUrl = /^https?:\/\//i.test(raw);
                    const href = raw ? (isUrl ? raw : `https://t.me/${raw.replace(/^@/, '')}`) : undefined;
                    return href ? (
                      <a href={href} target="_blank" className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white rounded-md px-3 py-1.5 text-sm">
                        <FontAwesomeIcon icon={faTelegram} /> Telegram
                      </a>
                    ) : null;
                  })()
                )}
                {/* Viber (requires phone) */}
                {Array.isArray(data.contacts.apps) && data.contacts.apps.includes('viber') && (
                  <a href={`viber://chat?number=%2B${String(data.contacts.phone).replace(/\D/g,'')}`} className="inline-flex items-center gap-2 bg-purple-700 hover:bg-purple-800 text-white rounded-md px-3 py-1.5 text-sm">
                    <FontAwesomeIcon icon={faViber} /> Viber
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-2 bg-neutral-100 border rounded-full px-3 py-1">
              <FontAwesomeIcon icon={faLocationDot} className="text-neutral-600" /> {escort.citta}
            </span>
            <span className="inline-flex items-center gap-2 bg-neutral-100 border rounded-full px-3 py-1">
              <FontAwesomeIcon icon={faBirthdayCake} className="text-neutral-600" /> {escort.eta} anni
            </span>
            <span className="inline-flex items-center gap-2 bg-neutral-100 border rounded-full px-3 py-1">
              <FontAwesomeIcon icon={faEuroSign} className="text-neutral-600" /> € {escort.prezzo}
            </span>
            {escort.tier && escort.tier !== 'STANDARD' && (
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${tierClasses}`}>
                <FontAwesomeIcon icon={faStar} /> {escort.tier}
                {escort.tierExpiresAt && <span className="ml-1 opacity-90">fino al {new Date(escort.tierExpiresAt).toLocaleDateString()} {countdown && `(${countdown})`}</span>}
              </span>
            )}
          </div>

          {/* Rimosso blocco Tabs per evitare duplicazioni e sfasamenti con il nuovo layout */}
        </div>

        {/* Sidebar */}
        <aside className="bg-gray-800 rounded-xl border shadow-sm p-4 h-fit">
          <div className="text-2xl font-bold text-white">€ {escort.prezzo}</div>
          <div className="mt-2 text-xs text-gray-400">Tariffa indicativa</div>
          {/* Contatti */}
          {data?.contacts && (
            <div className="mt-4 space-y-2">
              {data.contacts.whatsapp && (
                <a href={`https://wa.me/${String(data.contacts.whatsapp).replace(/\D/g,'')}`} target="_blank" className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-md py-2.5 font-semibold text-center">WhatsApp</a>
              )}
              {data.contacts.phone && (
                <a href={`tel:${data.contacts.phone}`} className="block w-full bg-red-600 hover:bg-red-700 text-white rounded-md py-2.5 font-semibold text-center">Chiama</a>
              )}
            </div>
          )}
          <button className="mt-2 w-full bg-gray-700 hover:bg-gray-600 text-white rounded-md py-2">Salva profilo</button>
          {me && data && me.id === data.userId && (
            <a href="/dashboard/crediti" className="mt-2 block w-full bg-emerald-600 hover:bg-emerald-700 text-white text-center rounded-md py-2 font-semibold">Promuovi</a>
          )}
          {escort.tier && escort.tier !== 'STANDARD' && (
            <div className="mt-4 border-t border-gray-700 pt-4 text-sm">
              <div className="font-semibold text-white">Promozione attiva</div>
              <div className="text-gray-300">{escort.tier} {escort.tierExpiresAt ? `fino al ${new Date(escort.tierExpiresAt).toLocaleDateString()}${countdown ? ` (${countdown})` : ''}` : ''}</div>
            </div>
          )}
          <div className="mt-4 border-t border-gray-700 pt-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-300">
              <FontAwesomeIcon icon={faShieldHeart} className="text-green-600" /> Verificata manualmente
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <FontAwesomeIcon icon={faStar} className="text-amber-500" /> Preferita da 128 utenti
            </div>
          </div>
        </aside>
      </div>
      {/* Quick Access + Content */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-6" id="quick-access">
        <aside className="md:col-span-1 bg-gray-800 border rounded-xl shadow-sm p-4 h-fit sticky top-24">
          <div className="text-sm font-semibold mb-2 text-gray-300">Quick Access</div>
          <nav className="space-y-1 text-sm text-gray-300">
            <a href="#bio" className="block px-2 py-1 rounded hover:bg-gray-700">Bio</a>
            <a href="#lingue" className="block px-2 py-1 rounded hover:bg-gray-700">Lingue</a>
            <a href="#su-di-me" className="block px-2 py-1 rounded hover:bg-gray-700">Su di me</a>
            <a href="#servizi" className="block px-2 py-1 rounded hover:bg-gray-700">Servizi</a>
            <a href="#tariffe" className="block px-2 py-1 rounded hover:bg-gray-700">Orari e Tariffe</a>
            <a href="#recensioni" className="block px-2 py-1 rounded hover:bg-gray-700">Recensioni</a>
            <a href="#commenti" className="block px-2 py-1 rounded hover:bg-gray-700">Commenti</a>
          </nav>
        </aside>
        <section className="md:col-span-3 space-y-6">
          {/* Bio */}
          <div id="bio" className="bg-gray-800 border rounded-xl shadow-sm p-4">
            <div className="text-lg font-semibold mb-2 text-white">Bio</div>
            {escort.descrizione ? (
              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
                <div className="whitespace-pre-wrap break-words leading-6">{escort.descrizione}</div>
                <div className="text-gray-400">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div className="font-medium text-white">Città</div><div>{escort.citta}</div>
                    {typeof (data as any)?.contacts?.website === 'string' && (
                      <>
                        <div className="font-medium text-white">Sito</div><div className="truncate">{(data as any)?.contacts?.website}</div>
                      </>
                    )}
                    <div className="font-medium text-white">Promozione</div><div>{escort.tier || 'STANDARD'}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-neutral-500">Nessuna bio disponibile.</div>
            )}
          </div>

          {/* Lingue */}
          <div id="lingue" className="bg-gray-800 border rounded-xl shadow-sm p-4">
            <div className="text-lg font-semibold mb-2 text-white">Lingue</div>
            {Array.isArray((data as any)?.languages) && (data as any).languages.length ? (
              <div className="flex flex-wrap gap-2">
                {((data as any).languages as any[]).map((l:any,idx:number)=> {
                  const label = typeof l === 'string'
                    ? l
                    : (typeof l === 'object' && (l.lang || l.level)
                        ? [l.lang, l.level].filter(Boolean).join(' — ')
                        : (l?.label || l?.name || l?.code || JSON.stringify(l)));
                  return (
                    <span key={idx} className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-200 border border-gray-600">{label}</span>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-neutral-500">Lingue non specificate.</div>
            )}
          </div>

          {/* Su di me */}
          <div id="su-di-me" className="bg-gray-800 border rounded-xl shadow-sm p-4">
            <div className="text-lg font-semibold mb-2 text-white">Su di me</div>
            {escort.descrizione ? (
              <div className="text-sm text-gray-300 whitespace-pre-wrap break-words overflow-x-hidden leading-6">{escort.descrizione}</div>
            ) : (
              <div className="text-sm text-neutral-500">Nessuna descrizione aggiuntiva.</div>
            )}
          </div>

          {/* Servizi */}
          <div id="servizi" className="bg-gray-800 border rounded-xl shadow-sm p-4">
            <div className="text-lg font-semibold mb-2 text-white">Servizi</div>
            {servicesList.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-300">
                {servicesList.map((s:string,idx:number)=> (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="mt-[6px] inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-neutral-500">Servizi non specificati.</div>
            )}
          </div>

          {/* Orari e Tariffe */}
          <div id="tariffe" className="bg-gray-800 border rounded-xl shadow-sm p-4">
            <div className="text-lg font-semibold mb-2 text-white">Orari e Tariffe</div>
            {ratesList.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-300">
                {ratesList.map((r:any,idx:number)=> (
                  <div key={idx} className="border border-gray-600 rounded-md p-2 flex items-center justify-between">
                    <div className="text-gray-300">{r?.label || r?.type || r?.duration || 'Sessione'}</div>
                    <div className="font-semibold text-white">€ {r?.price ?? '-'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-neutral-500">Tariffe non specificate.</div>
            )}
          </div>
        </section>
      </div>
      {/* Sezioni in fondo: Recensioni e Commenti */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6" id="recensioni">
        <section className="bg-gray-800 border rounded-xl shadow-sm p-4" id="commenti">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Recensioni</h2>
            <div className="text-xs text-neutral-500">{reviews.length} recensioni</div>
          </div>
          <div className="space-y-3">
            {reviews.length === 0 ? (
              <div className="text-sm text-neutral-500">Nessuna recensione, scrivi la prima.</div>
            ) : reviews.map((r: any) => (
              <div key={r.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{r.title}</div>
                  <div className="text-xs text-neutral-500">{new Date(r.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="mt-1 flex items-center gap-1 text-amber-500 text-xs">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <FontAwesomeIcon key={i} icon={faStar} className={i < (r.rating ?? 0) ? '' : 'text-neutral-300'} />
                  ))}
                  <span className="ml-2 text-neutral-600">da {r.author?.nome || 'Utente'}</span>
                </div>
                <div className="mt-1 text-sm text-gray-300">{r.body}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t pt-4">
            <div className="text-sm font-semibold mb-2">Lascia una recensione</div>
            <div className="grid gap-2">
              <input className="border rounded-md px-3 py-2" placeholder="Titolo" value={revTitle} onChange={e=>setRevTitle(e.target.value)} />
              <select className="border rounded-md px-3 py-2 w-32" value={revRating} onChange={e=>setRevRating(Number(e.target.value))}>
                {[5,4,3,2,1].map(v => <option key={v} value={v}>{v} stelle</option>)}
              </select>
              <textarea className="border rounded-md px-3 py-2 min-h-[100px]" placeholder="Scrivi la tua esperienza" value={revBody} onChange={e=>setRevBody(e.target.value)} />
              <Button onClick={submitReview} disabled={submittingRev || !revTitle || !revBody} className="bg-red-600 hover:bg-red-700 text-white">{submittingRev ? 'Invio…' : 'Invia recensione'}</Button>
            </div>
          </div>
        </section>

        <section className="bg-gray-800 border rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2"><FontAwesomeIcon icon={faComments} /> Commenti</h2>
            <div className="text-xs text-neutral-500">{comments.length} commenti</div>
          </div>
          <div className="space-y-3">
            {comments.length === 0 ? (
              <div className="text-sm text-neutral-500">Nessun commento, scrivi il primo.</div>
            ) : comments.map((c: any) => (
              <div key={c.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-300">{c.body}</div>
                  <div className="text-xs text-neutral-500">{new Date(c.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="text-xs text-neutral-500 mt-1">da {c.author?.nome || 'Utente'}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t pt-4">
            <div className="text-sm font-semibold mb-2">Aggiungi un commento</div>
            <div className="grid gap-2">
              <textarea className="border rounded-md px-3 py-2 min-h-[80px]" placeholder="Scrivi un commento" value={commentBody} onChange={e=>setCommentBody(e.target.value)} />
              <Button onClick={submitComment} disabled={submittingCom || !commentBody} className="bg-neutral-900 hover:bg-black text-white">{submittingCom ? 'Invio…' : 'Invia commento'}</Button>
            </div>
          </div>
        </section>
      </div>
      {/* Bottom action bar */}
      <div className="sticky bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur border-t border-gray-700 mt-10">
        <div className="container mx-auto px-4 py-3 flex flex-wrap gap-3 justify-center">
          <Button
            variant="secondary"
            onClick={async()=>{
              try { await navigator.clipboard.writeText(window.location.href); alert('Link copiato'); } catch { alert('Copia link non supportata'); }
            }}
          >Copia link</Button>
          <Button variant="secondary" onClick={()=>{ setReportMsg(""); setShowReportProblem(true); }}>Segnala un problema</Button>
          <Button variant="secondary" onClick={()=>{ setReportPhotoUrl(escort.foto[active]||""); setReportReason(""); setShowReportPhoto(true); }}>Segnala foto</Button>
        </div>
      </div>

      {/* Modal: Segnala un problema */}
      {showReportProblem && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60">
          <div className="w-full max-w-lg bg-gray-800 border border-gray-600 rounded-xl p-5">
            <div className="text-lg font-semibold text-white mb-2">Segnala un problema</div>
            <textarea value={reportMsg} onChange={e=>setReportMsg(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 min-h-[120px]" placeholder="Descrivi il problema riscontrato" />
            <div className="flex justify-end gap-2 mt-3">
              <Button variant="secondary" onClick={()=>setShowReportProblem(false)}>Annulla</Button>
              <Button onClick={async()=>{
                try{
                  const token = localStorage.getItem('auth-token')||'';
                  const r = await fetch('/api/report/problem', { method:'POST', headers:{ 'Content-Type':'application/json', ...(token? { Authorization:`Bearer ${token}` }: {}) }, body: JSON.stringify({ slug, message: reportMsg }) });
                  const j = await r.json().catch(()=>({}));
                  if(!r.ok){ alert(j?.error||'Errore invio segnalazione'); return; }
                  alert('Segnalazione inviata'); setShowReportProblem(false); setReportMsg("");
                }catch{ alert('Errore rete'); }
              }}>Invia</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Segnala foto */}
      {showReportPhoto && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60">
          <div className="w-full max-w-lg bg-gray-800 border border-gray-600 rounded-xl p-5">
            <div className="text-lg font-semibold text-white mb-2">Segnala foto</div>
            <div className="text-sm text-gray-300 mb-2">Stai segnalando la foto corrente.</div>
            <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-gray-700 mb-3">
              <img src={reportPhotoUrl || escort.foto[active] || '/placeholder.svg'} alt="Foto da segnalare" className="object-cover absolute inset-0 w-full h-full" />
            </div>
            <input value={reportReason} onChange={e=>setReportReason(e.target.value)} placeholder="Motivo (opzionale)" className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2" />
            <div className="flex justify-end gap-2 mt-3">
              <Button variant="secondary" onClick={()=>setShowReportPhoto(false)}>Annulla</Button>
              <Button onClick={async()=>{
                try{
                  const token = localStorage.getItem('auth-token')||'';
                  const r = await fetch('/api/report/photo', { method:'POST', headers:{ 'Content-Type':'application/json', ...(token? { Authorization:`Bearer ${token}` }: {}) }, body: JSON.stringify({ slug, photoUrl: reportPhotoUrl || escort.foto[active], reason: reportReason }) });
                  const j = await r.json().catch(()=>({}));
                  if(!r.ok){ alert(j?.error||'Errore invio segnalazione foto'); return; }
                  alert('Segnalazione foto inviata'); setShowReportPhoto(false); setReportReason("");
                }catch{ alert('Errore rete'); }
              }}>Invia</Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
