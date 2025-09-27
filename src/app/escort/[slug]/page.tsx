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
import { faHeart as faHeartSolid } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";

export default function EscortDetailPage() {
  type EscortView = {
    slug: string;
    nome: string;
    eta: number;
    citta: string;
    prezzo: number;
    descrizione: string;
    foto: string[];
    videos?: string[];
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
      videos: [],
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
      videos: Array.isArray((data as any)?.videos) ? (data as any).videos : [],
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
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  // Lightbox per immagine principale
  const [lightboxOpen, setLightboxOpen] = useState(false);
  // Rapporto d'aspetto dinamico per l'immagine principale (percentuale padding-top)
  const [mainAspectPct, setMainAspectPct] = useState<number>(66.66); // default ~16:10
  // Tick per ritentare l'inizializzazione mappa quando il container è pronto
  const [mapInitTick, setMapInitTick] = useState(0);
  const [mapCity, setMapCity] = useState<string>("");
  const baseCity = useMemo(()=>{
    try { return (data as any)?.cities?.baseCity || ""; } catch { return ""; }
  }, [data]);
  const hasRealPhotos = useMemo(()=>
    Array.isArray(escort.foto) && escort.foto.some(u => typeof u === 'string' && u.trim() && u !== '/placeholder.svg')
  , [escort.foto]);

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
        // Supporta sia formato agenzia { general: [], extra: [] } che formato wizard { categories: { general: [] } }
        const categories = raw.categories || raw;
        if (categories && typeof categories === 'object') {
          ['general','extra','fetish','virtual'].forEach((k) => {
            if (Array.isArray(categories?.[k])) out.push(...categories[k].map((s:any)=> String(s)));
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

  // Video mostrati in sezione separata (niente unione con foto)

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

  // Minimappa: usa prima le coordinate salvate, altrimenti geocoding della città
  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        if (!mapDivRef.current) return; // container non ancora montato
        const L = await loadLeafletFromCDN().catch(() => null);
        if (!L) return;
        // Se già creata, non ricreare
        if (mapRef.current) return;
        // 1) Coordinate precise dal profilo (cities.position)
        let lat: number | null = null;
        let lon: number | null = null;
        try {
          const pos = (data as any)?.cities?.position;
          if (pos && typeof pos.lat === 'number' && typeof pos.lng === 'number') { lat = pos.lat; lon = pos.lng; }
        } catch {}
        // 2) In assenza, geocoding della città base
        if ((lat === null || lon === null) && escort.citta) {
          const q = encodeURIComponent(escort.citta);
          const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`, { headers: { 'Accept-Language': 'it' } });
          const arr = resp.ok ? await resp.json() : [];
          lat = arr?.[0]?.lat ? parseFloat(arr[0].lat) : null;
          lon = arr?.[0]?.lon ? parseFloat(arr[0].lon) : null;
        }
        // 3) Fallback Italia
        if (lat === null || lon === null) { lat = 41.8719; lon = 12.5674; }
        if (canceled) return;
        mapRef.current = L.map(mapDivRef.current, { 
          zoomControl: true,
          dragging: true,
          touchZoom: true,
          doubleClickZoom: true,
          scrollWheelZoom: true
        }).setView([lat as number, lon as number], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(mapRef.current);
        markerRef.current = L.marker([lat as number, lon as number]).addTo(mapRef.current).bindPopup(escort.citta || 'Posizione');
        
        // Forza il cursore sulla mappa
        setTimeout(() => {
          const mapContainer = mapRef.current?.getContainer();
          if (mapContainer) {
            mapContainer.style.setProperty('cursor', 'grab', 'important');
            const style = document.createElement('style');
            style.textContent = `
              .leaflet-container { cursor: grab !important; }
              .leaflet-dragging .leaflet-container { cursor: grabbing !important; }
              .leaflet-clickable { cursor: pointer !important; }
            `;
            document.head.appendChild(style);
          }
        }, 100);
        try { setTimeout(()=> { try { mapRef.current?.invalidateSize?.(); } catch {} }, 300); } catch {}
        // Reverse geocoding per titolo, se abbiamo coordinate
        try {
          if (lat !== null && lon !== null) {
            const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`, { headers: { 'Accept-Language': 'it' } });
            const j = await r.json();
            if (!canceled) {
              const city = j?.address?.city || j?.address?.town || j?.address?.village || j?.address?.municipality || '';
              if (city) setMapCity(city);
            }
          }
        } catch {}
      } catch {}
    })();
    return () => { canceled = true; };
  }, [escort.citta, data, baseCity, mapInitTick]);

  // Controlla se l'escort è nei preferiti
  useEffect(() => {
    (async () => {
      if (!data?.userId) return;
      
      try {
        const token = localStorage.getItem('auth-token');
        if (!token) return;

        const res = await fetch(`/api/user/is-favorite?targetUserId=${data.userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const result = await res.json();
          setIsFavorite(result.isFavorite);
        }
      } catch (error) {
        console.error('Errore controllo preferito:', error);
      }
    })();
  }, [data?.userId]);

  // Se il container non è pronto al primo giro, ritenta tra 300ms
  useEffect(() => {
    if (!mapRef.current && !mapDivRef.current) {
      const t = setTimeout(() => setMapInitTick((x)=>x+1), 300);
      return () => clearTimeout(t);
    }
  }, [escort.citta, data, mapInitTick]);

  const toggleFavorite = async () => {
    if (!data?.userId || favoriteLoading) return;
    
    const token = localStorage.getItem('auth-token');
    if (!token) {
      alert('Devi essere autenticato per aggiungere ai preferiti');
      return;
    }

    setFavoriteLoading(true);
    try {
      const method = isFavorite ? 'DELETE' : 'POST';
      const res = await fetch('/api/user/favorites', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetUserId: data.userId })
      });

      if (res.ok) {
        setIsFavorite(!isFavorite);
      } else {
        const error = await res.json();
        alert(error.error || 'Errore gestione preferiti');
      }
    } catch (error) {
      console.error('Errore toggle preferito:', error);
      alert('Errore gestione preferiti');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!data?.userId || saveLoading) return;
    
    const token = localStorage.getItem('auth-token');
    if (!token) {
      alert('Devi essere autenticato per salvare il profilo');
      return;
    }

    setSaveLoading(true);
    try {
      const method = isSaved ? 'DELETE' : 'POST';
      const res = await fetch('/api/user/saved-profiles', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetUserId: data.userId })
      });

      if (res.ok) {
        setIsSaved(!isSaved);
        alert(isSaved ? 'Profilo rimosso dai salvati' : 'Profilo salvato!');
      } else {
        const error = await res.json();
        alert(error.error || 'Errore salvataggio profilo');
      }
    } catch (error) {
      console.error('Errore salvataggio profilo:', error);
      alert('Errore salvataggio profilo');
    } finally {
      setSaveLoading(false);
    }
  };

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
        const r = await fetch(`/api/public/recensioni/${slug}`);
        if (r.ok) { const j = await r.json(); setReviews(j.items || []); }
      } catch {}
      try {
        const c = await fetch(`/api/public/commenti/${slug}`);
        if (c.ok) { const j = await c.json(); setComments(j.items || []); }
      } catch {}
    })();
  }, [slug]);

  async function submitReview() {
    if (!data?.userId) { alert('Profilo non caricato'); return; }
    setSubmittingRev(true);
    try {
      const token = localStorage.getItem('auth-token') || '';
      if (!token) { window.location.href = `/autenticazione?redirect=/escort/${slug}`; return; }
      const res = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ targetUserId: data.userId, rating: revRating, title: revTitle, body: revBody }) });
      const j = await res.json();
      if (res.status === 401) { window.location.href = `/autenticazione?redirect=/escort/${slug}`; return; }
      if (!res.ok) { alert(j?.error || 'Errore invio recensione'); return; }
      alert('Recensione inviata, in attesa di approvazione.');
      try { const r = await fetch(`/api/public/recensioni/${slug}`); if (r.ok) { const jr = await r.json(); setReviews(jr.items || []); } } catch {}
      setRevTitle(""); setRevBody(""); setRevRating(5);
    } finally { setSubmittingRev(false); }
  }

  async function submitComment() {
    if (!data?.userId) { alert('Profilo non caricato'); return; }
    setSubmittingCom(true);
    try {
      const token = localStorage.getItem('auth-token') || '';
      const res = await fetch('/api/comments', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token? { 'Authorization': `Bearer ${token}` } : {}) }, body: JSON.stringify({ targetUserId: data.userId, body: commentBody }) });
      const j = await res.json();
      if (res.status === 401) { window.location.href = `/autenticazione?redirect=/escort/${slug}`; return; }
      if (!res.ok) { alert(j?.error || 'Errore invio commento'); return; }
      try { const c = await fetch(`/api/public/commenti/${slug}`); if (c.ok) { const jc = await c.json(); setComments(jc.items || []); } } catch {}
      setCommentBody("");
    } finally { setSubmittingCom(false); }
  }

  const bioInfo: any = useMemo(()=>{ try { return (data as any)?.contacts?.bioInfo || null; } catch { return null; } }, [data]);

  function pick(obj:any, keys:string[]): string | undefined {
    for (const k of keys) { const v = obj?.[k]; if (v !== undefined && v !== null && String(v).trim() !== '') return String(v); }
    return undefined;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Escort", href: "/escort" }, { label: escort.nome }]} />
      <SectionHeader title={`${escort.nome}, ${escort.eta}`} subtitle={`${bioInfo?.slogan ? `${bioInfo.slogan} · ` : ''}Profilo a ${escort.citta}`} />

      <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 mt-2`}>
        {/* Galleria sempre visibile (usa placeholder se mancano foto reali) */}
        <div className="md:col-span-2 bg-gray-800 rounded-xl border shadow-sm p-4">
          <div className="max-w-[820px] mx-auto">
          <div className="relative w-full rounded-lg overflow-hidden" style={{ paddingTop: `${mainAspectPct}%` }}>
            <img
              src={(escort.foto[active] || escort.foto[0] || '/placeholder.svg')}
              alt={`${escort.nome} principale`}
              className="object-contain absolute inset-0 w-full h-full cursor-zoom-in bg-gray-900"
              onClick={()=>setLightboxOpen(true)}
              onLoad={(e)=>{
                try{
                  const img = e.currentTarget as HTMLImageElement;
                  if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                    const pct = (img.naturalHeight / img.naturalWidth) * 100;
                    // Clamp per evitare riquadri troppo alti o troppo bassi
                    const clamped = Math.min(75, Math.max(56, pct));
                    setMainAspectPct(clamped);
                  }
                }catch{}
              }}
              onError={(e)=>{ const t=e.currentTarget as HTMLImageElement; if (t.src.indexOf('/placeholder.svg')===-1) t.src='/placeholder.svg'; }}
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
                title={`Foto ${idx+1}`}
              >
                <img
                  src={src || '/placeholder.svg'}
                  alt={`${escort.nome} thumb ${idx+1}`}
                  className="object-cover absolute inset-0 w-full h-full"
                  onError={(e)=>{ const t=e.currentTarget as HTMLImageElement; if (t.src.indexOf('/placeholder.svg')===-1) t.src='/placeholder.svg'; }}
                />
              </button>
            ))}
          </div>
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
            <span className="inline-flex items-center gap-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-full px-3 py-1">
              <FontAwesomeIcon icon={faLocationDot} className="text-gray-200" /> {escort.citta}
            </span>
            <span className="inline-flex items-center gap-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-full px-3 py-1">
              <FontAwesomeIcon icon={faBirthdayCake} className="text-gray-200" /> {escort.eta} anni
            </span>
            <span className="inline-flex items-center gap-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-full px-3 py-1">
              <FontAwesomeIcon icon={faEuroSign} className="text-gray-200" /> € {escort.prezzo}
            </span>
            {/* Bio info chips se presenti (slogan/sesso/tipo profilo/nazionalità) */}
            {(() => {
              try {
                const b: any = (data as any)?.contacts?.bioInfo || {};
                const chips: Array<string> = [];
                if (b.slogan) chips.push(String(b.slogan));
                if (b.sesso) chips.push(String(b.sesso));
                if (b.tipoProfilo) chips.push(String(b.tipoProfilo));
                if (b.nazionalita) chips.push(String(b.nazionalita));
                return chips.map((t, i) => (
                  <span key={`biochip-${i}`} className="inline-flex items-center gap-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-full px-3 py-1">{t}</span>
                ));
              } catch { return null; }
            })()}
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
              <button
                onClick={toggleFavorite}
                disabled={favoriteLoading}
                className={`block w-full rounded-md py-2.5 font-semibold text-center transition-colors ${
                  isFavorite 
                    ? 'bg-pink-600 hover:bg-pink-700 text-white' 
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                } ${favoriteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <FontAwesomeIcon icon={isFavorite ? faHeartSolid : faHeartRegular} className="mr-2" />
                {favoriteLoading ? 'Caricamento...' : (isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti')}
              </button>
            </div>
          )}
          <button 
            onClick={saveProfile}
            disabled={saveLoading}
            className={`mt-2 w-full rounded-md py-2 text-white transition-colors ${
              isSaved 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-gray-700 hover:bg-gray-600'
            } ${saveLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {saveLoading ? 'Caricamento...' : (isSaved ? '✓ Profilo salvato' : 'Salva profilo')}
          </button>
          {me && data && me.id === data.userId && (
            <a href="/dashboard/crediti" className="mt-2 block w-full bg-emerald-600 hover:bg-emerald-700 text-white text-center rounded-md py-2 font-semibold">Promuovi</a>
          )}
          {escort.tier && escort.tier !== 'STANDARD' && (
            <div className="mt-4 border-t border-gray-700 pt-4 text-sm">
              <div className="font-semibold text-white">Promozione attiva</div>
              <div className="text-gray-300">{escort.tier} {escort.tierExpiresAt ? `fino al ${new Date(escort.tierExpiresAt).toLocaleDateString()}${countdown ? ` (${countdown})` : ''}` : ''}</div>
            </div>
          )}
          {/* Orari di Lavoro e Vacanze (già presenti più sotto, qui rimangono in evidenza nella sidebar) */}
          {/* Orari di lavoro e vacanze (contacts.workingHours) */}
          {(() => {
            try {
              const wh: any = (data as any)?.workingHours || (data as any)?.contacts?.workingHours;
              if (!wh) return null;
              const sameDaily = wh?.mode === 'same' || wh?.sameEveryDay;
              const is247 = !!wh?.always || !!wh?.is247;
              const ranges: Array<{ start: string; end: string }> = Array.isArray(wh?.ranges)
                ? wh.ranges
                : (sameDaily && wh?.start && wh?.end ? [{ start: String(wh.start), end: String(wh.end) }] : []);
              // Supporto forma a giorni: { days: { mon:{start,end,enabled}, ... } }
              const dayMap = wh?.days && typeof wh.days === 'object' ? wh.days : null;
              const vacations: Array<{ from: string; to: string }> = Array.isArray(wh?.vacations) ? wh.vacations : [];
              return (
                <div className="mt-4 border-t border-gray-700 pt-4 text-sm">
                  <div className="font-semibold text-white mb-1">Orari di Lavoro</div>
                  {is247 && <div className="text-green-400">Disponibile 24/7</div>}
                  {!is247 && ranges.length > 0 && (
                    <ul className="list-disc ml-5 text-gray-300">
                      {ranges.map((r, i) => (
                        <li key={`wh-${i}`}>{r.start} – {r.end}</li>
                      ))}
                    </ul>
                  )}
                  {!is247 && !ranges.length && dayMap && (
                    <ul className="list-disc ml-5 text-gray-300">
                      {Object.entries(dayMap).filter(([,v]: any)=> !!v && (v.enabled || (v.start && v.end))).map(([d,v]: any, i) => (
                        <li key={`wh-day-${i}`}>{d.toUpperCase()}: {v.start || '—'} – {v.end || '—'}</li>
                      ))}
                    </ul>
                  )}
                  {vacations.length > 0 && (
                    <div className="mt-2">
                      <div className="font-medium text-white">Vacanze</div>
                      <ul className="list-disc ml-5 text-gray-300">
                        {vacations.map((v, i) => (
                          <li key={`vac-${i}`}>{new Date(v.from).toLocaleDateString()} – {new Date(v.to).toLocaleDateString()}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            } catch { return null; }
          })()}
          <div className="mt-4 border-t border-gray-700 pt-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-300">
              <FontAwesomeIcon icon={faShieldHeart} className="text-green-600" /> Verificata manualmente
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <FontAwesomeIcon icon={faStar} className="text-amber-500" /> Preferita da 128 utenti
            </div>
          </div>

          {/* Sezione Video nella sidebar (se disponibili) */}
          {Array.isArray(escort.videos) && escort.videos.filter(u=> typeof u === 'string' && u.trim()).length > 0 && (
            <div className="mt-4 border-t border-gray-700 pt-4">
              <div className="text-sm font-semibold text-white mb-2">Video</div>
              <div className="grid gap-3">
                {escort.videos.filter(u=> typeof u === 'string' && u.trim()).map((u, i) => {
                  const src = u?.startsWith('/uploads/') ? ('/api' + u) : u;
                  return (
                    <video key={i} controls preload="metadata" className="w-full rounded-md border border-gray-700 bg-black aspect-video object-contain">
                      <source src={src} />
                    </video>
                  );
                })}
              </div>
            </div>
          )}

          {/* Minimappa: mostra solo se abbiamo coordinate o città */}
          {(((data as any)?.cities?.position && typeof (data as any).cities.position.lat === 'number' && typeof (data as any).cities.position.lng === 'number') || escort.citta || baseCity) && (
            <div className="mt-4 border-t border-gray-700 pt-4">
              <div className="text-sm font-semibold text-white mb-2">{`Localizzazione${(mapCity || baseCity || escort.citta) ? `: ${mapCity || baseCity || escort.citta}` : ''}`}</div>
              <div 
                ref={mapDivRef} 
                className="w-full h-[220px] rounded-md overflow-hidden border border-gray-700" 
                style={{ 
                  cursor: 'grab',
                  position: 'relative'
                }}
              />
            </div>
          )}
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
                    <div className="font-medium text-white">Città</div>
                    <div>
                      {(() => {
                        const allCities = [];
                        const citiesData = (data as any)?.cities || {};
                        
                        // Aggiungi città principali
                        if (citiesData.baseCity) allCities.push(citiesData.baseCity);
                        if (citiesData.secondCity) allCities.push(citiesData.secondCity);
                        if (citiesData.thirdCity) allCities.push(citiesData.thirdCity);
                        if (citiesData.fourthCity) allCities.push(citiesData.fourthCity);
                        
                        // Aggiungi città aggiuntive
                        if (Array.isArray(citiesData.cities)) {
                          allCities.push(...citiesData.cities.filter((c: string) => c && c.trim()));
                        }
                        
                        // Rimuovi duplicati e mostra
                        const uniqueCities = [...new Set(allCities)];
                        return uniqueCities.length > 0 ? uniqueCities.join(', ') : escort.citta;
                      })()}
                    </div>
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

          {/* Dettagli fisici e informazioni profilo (da contacts.bioInfo) */}
          {bioInfo && (
            <div className="bg-gray-800 border rounded-xl shadow-sm p-4">
              <div className="text-lg font-semibold mb-3 text-white">Dettagli</div>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm text-gray-200">
                {(() => {
                  const rows: Array<{ label: string; value?: string }> = [];
                  const b:any = bioInfo;
                  const get = (keys:string[]) => { for (const k of keys) { const v = b?.[k]; if (v !== undefined && v !== null && String(v).trim() !== '') return String(v); } };
                  const push = (label:string, value?:string)=>{ if (value) rows.push({ label, value }); };
                  push('Nome Profilo', get(['nomeProfilo','profileName']));
                  push('Slogan', get(['slogan']));
                  push('Età', get(['eta','age']));
                  push('Sesso', get(['sesso','gender']));
                  push('Tipo profilo', get(['tipoProfilo','profileType']));
                  push('Nazionalità', get(['nazionalita','nationality']));
                  push('Città di residenza', get(['cittaResidenza','residenceCity']));
                  // Debug per vedere tutti i campi disponibili
                  console.log('🔍 BioInfo Debug:', bioInfo);
                  push('Colore Capelli', get(['coloreCapelli','capelli','hairColor','coloreCapelli']));
                  push('Colore Occhi', get(['coloreOcchi','occhi','eyeColor','coloreOcchi']));
                  push('Altezza', get(['altezza','height']));
                  push('Peso', get(['peso','weight']));
                  push('Seno / Coppa', get(['seno','cup','coppa','breast']));
                  push('Vita', get(['vita','waist']));
                  push('Fianchi', get(['fianchi','hips']));
                  // Controlla se sono boolean o string
                  const hasTattoos = b?.tatuaggi;
                  const hasPiercings = b?.piercing;
                  push('Tatuaggi', hasTattoos === true ? 'Sì' : (hasTattoos === false ? 'No' : (hasTattoos ? String(hasTattoos) : undefined)));
                  push('Piercing', hasPiercings === true ? 'Sì' : (hasPiercings === false ? 'No' : (hasPiercings ? String(hasPiercings) : undefined)));
                  return rows.map((r, i) => (
                    <div key={`bio-row-${i}`} className="flex items-start justify-between gap-4 border border-gray-700 rounded-md px-3 py-2 bg-gray-900">
                      <span className="text-gray-400">{r.label}</span>
                      <span className="font-medium text-white">{r.value}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* Orari di Lavoro */}
          {(() => {
            try {
              const wh: any = (data as any)?.workingHours || (data as any)?.contacts?.workingHours;
              console.log('🕐 Working Hours Debug:', { 
                dataWorkingHours: (data as any)?.workingHours, 
                contactsWorkingHours: (data as any)?.contacts?.workingHours,
                fullContacts: (data as any)?.contacts,
                wh 
              });
              if (!wh) {
                console.log('❌ No working hours found');
                return (
                  <div className="bg-gray-800 border rounded-xl shadow-sm p-4">
                    <div className="text-lg font-semibold mb-3 text-white">Orari di Lavoro</div>
                    <div className="text-sm text-gray-400">Orari non specificati.</div>
                  </div>
                );
              }
              const sameDaily = wh?.mode === 'same' || wh?.sameEveryDay;
              const is247 = !!wh?.always || !!wh?.is247;
              const ranges: Array<{ start: string; end: string }> = Array.isArray(wh?.ranges)
                ? wh.ranges
                : (sameDaily && wh?.start && wh?.end ? [{ start: String(wh.start), end: String(wh.end) }] : []);
              // Supporto forma a giorni: { days: { mon:{start,end,enabled}, ... } }
              const dayMap = wh?.days && typeof wh.days === 'object' ? wh.days : null;
              const vacations: Array<{ from: string; to: string }> = Array.isArray(wh?.vacations) ? wh.vacations : [];
              return (
                <div className="bg-gray-800 border rounded-xl shadow-sm p-4">
                  <div className="text-lg font-semibold mb-3 text-white">Orari di Lavoro</div>
                  {is247 && <div className="text-green-400 text-sm">Disponibile 24/7</div>}
                  {!is247 && ranges.length > 0 && (
                    <ul className="list-disc ml-5 text-gray-300 text-sm">
                      {ranges.map((r, i) => (
                        <li key={`wh-${i}`}>{r.start} – {r.end}</li>
                      ))}
                    </ul>
                  )}
                  {!is247 && !ranges.length && dayMap && (
                    <ul className="list-disc ml-5 text-gray-300 text-sm">
                      {Object.entries(dayMap).filter(([,v]: any)=> !!v && (v.enabled || (v.start && v.end))).map(([d,v]: any, i) => (
                        <li key={`wh-day-${i}`}>{d.toUpperCase()}: {v.start || '—'} – {v.end || '—'}</li>
                      ))}
                    </ul>
                  )}
                  {vacations.length > 0 && (
                    <div className="mt-3">
                      <div className="font-medium text-white mb-1">Vacanze</div>
                      <ul className="list-disc ml-5 text-gray-300 text-sm">
                        {vacations.map((v, i) => (
                          <li key={`vac-${i}`}>{new Date(v.from).toLocaleDateString()} – {new Date(v.to).toLocaleDateString()}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            } catch { return null; }
          })()}

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
          <Button 
            className="bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700" 
            onClick={()=>{ setReportMsg(""); setShowReportProblem(true); }}
          >
            Segnala un problema
          </Button>
          <Button 
            className="bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700" 
            onClick={()=>{ setReportPhotoUrl(escort.foto[active]||""); setReportReason(""); setShowReportPhoto(true); }}
          >
            Segnala foto
          </Button>
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
      {/* Lightbox fullscreen immagine principale */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" onClick={()=>setLightboxOpen(false)}>
          <img
            src={(escort.foto[active] || escort.foto[0] || '/placeholder.svg')}
            alt={`${escort.nome} fullscreen`}
            className="max-w-[96vw] max-h-[96vh] object-contain"
          />
          <button
            className="absolute top-4 right-4 bg-gray-800/90 hover:bg-gray-800 text-white px-3 py-1 rounded-md border border-gray-700"
            onClick={(e)=>{ e.stopPropagation(); setLightboxOpen(false); }}
          >
            Chiudi
          </button>
        </div>
      )}
    </main>
  );
}
