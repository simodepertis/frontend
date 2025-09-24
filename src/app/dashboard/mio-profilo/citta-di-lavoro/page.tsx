"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// Load Leaflet from CDN (no npm package required)
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
          // fix default icon paths
          L.Icon.Default.mergeOptions({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          });
          resolve(L);
        } catch (e) { reject(e); }
      };
      s.onerror = () => reject(new Error('Leaflet CDN load failed'));
      document.body.appendChild(s);
    } else {
      // script already present but L not ready yet
      const iv = setInterval(() => {
        if ((window as any).L) {
          clearInterval(iv);
          const L = (window as any).L;
          L.Icon.Default.mergeOptions({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          });
          resolve(L);
        }
      }, 50);
      setTimeout(() => { clearInterval(iv); reject(new Error('Leaflet not available')); }, 5000);
    }
  });
}

export default function CittaDiLavoroPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    baseCity: "",
    secondCity: "",
    thirdCity: "",
    fourthCity: "",
    zones: [] as string[],
    position: { lat: 41.9028, lng: 12.4964 }, // Roma default
    availability: {
      incall: { address: "", cap: "", type: "", other: "" },
      outcall: { enabled: true, type: "", other: "" },
    },
  });

  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const [leafletReady, setLeafletReady] = useState(false);
  // Autocomplete state
  const [addrQuery, setAddrQuery] = useState("");
  const [addrResults, setAddrResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  // Chevron dropdown open states per city field
  const [openCity, setOpenCity] = useState<{ [k:string]: boolean }>({});
  const COMMON_CITIES: string[] = [
    "Milano","Roma","Torino","Napoli","Bologna","Firenze","Genova","Venezia","Verona","Padova",
    "Brescia","Monza","Bergamo","Como","Varese","Piacenza","Parma","Modena","Reggio Emilia","Rimini",
    "Ancona","Pesaro","Perugia","Terni","L'Aquila","Pescara","Bari","Lecce","Taranto","Brindisi",
    "Cagliari","Sassari","Palermo","Catania","Messina","Reggio Calabria","Trieste","Udine","Bolzano","Trento"
  ];

  // City autocomplete states per field
  const [cityQ, setCityQ] = useState<{ [k:string]: string }>({});
  const [cityRes, setCityRes] = useState<{ [k:string]: any[] }>({});
  const [cityLoading, setCityLoading] = useState<{ [k:string]: boolean }>({});

  useEffect(() => {
    // inject Leaflet CSS once
    const id = "leaflet-css";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("auth-token") || "";
        const r = await fetch("/api/profile/citta", { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
        if (r.status === 401) { window.location.href = `/autenticazione?redirect=${encodeURIComponent(window.location.pathname)}`; return; }
        if (r.ok) {
          const j = await r.json();
          if (j?.cities) setForm((f: any) => ({ ...f, ...j.cities }));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    // Initialize map when container ready
    if (!mapDivRef.current || mapRef.current || loading) return;
    (async () => {
      const L = await loadLeafletFromCDN();
      const map = L.map(mapDivRef.current!).setView([form.position.lat, form.position.lng], 12);
      mapRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);
      const marker = L.marker([form.position.lat, form.position.lng], { draggable: true }).addTo(map);
      markerRef.current = marker;
      marker.on("dragend", () => {
        const p = marker.getLatLng();
        setForm((f: any) => ({ ...f, position: { lat: p.lat, lng: p.lng } }));
      });
      map.on("click", (e: any) => {
        const p = e.latlng;
        marker.setLatLng(p);
        setForm((f: any) => ({ ...f, position: { lat: p.lat, lng: p.lng } }));
      });
      setLeafletReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapDivRef.current, loading]);

  useEffect(() => {
    // center marker when form.position changes
    if (leafletReady && mapRef.current && markerRef.current) {
      markerRef.current.setLatLng([form.position.lat, form.position.lng]);
      mapRef.current.setView([form.position.lat, form.position.lng]);
    }
  }, [form.position, leafletReady]);

  function setZoneInput(idx: number, val: string) {
    setForm((f: any) => {
      const z = [...(f.zones || [])];
      z[idx] = val;
      return { ...f, zones: z };
    });
  }

  function addZone() {
    setForm((f: any) => ({ ...f, zones: [...(f.zones || []), ""] }));
  }

  function removeZone(i: number) {
    setForm((f: any) => ({ ...f, zones: (f.zones || []).filter((_: any, ix: number) => ix !== i) }));
  }

  // Debounced fetch for city suggestions
  useEffect(() => {
    const keys = Object.keys(cityQ);
    if (keys.length === 0) return;
    const ctrls: any[] = [];
    keys.forEach((k) => {
      const q = (cityQ[k] || '').trim();
      if (!q) { setCityRes(prev=>({ ...prev, [k]: [] })); return; }
      setCityLoading(prev=>({ ...prev, [k]: true }));
      const ctrl = setTimeout(async () => {
        try {
          const url = `https://nominatim.openstreetmap.org/search?format=json&limit=6&accept-language=it&q=${encodeURIComponent(q)}`;
          const r = await fetch(url, { headers: { 'Accept':'application/json' } });
          const j = await r.json();
          const filtered = Array.isArray(j) ? j.filter((it:any)=> it.class==='place' && ['city','town','village','hamlet','municipality'].includes(it.type)).map((it:any)=> ({
            label: it.display_name,
            city: it.address?.city || it.address?.town || it.address?.village || it.address?.hamlet || it.address?.municipality || it.display_name.split(',')[0],
            lat: Number(it.lat), lon: Number(it.lon)
          })) : [];
          setCityRes(prev=>({ ...prev, [k]: filtered }));
        } catch { setCityRes(prev=>({ ...prev, [k]: [] })); }
        finally { setCityLoading(prev=>({ ...prev, [k]: false })); }
      }, 300);
      ctrls.push(ctrl);
    });
    return () => { ctrls.forEach(clearTimeout); };
  }, [cityQ]);

  async function save() {
    setSaving(true);
    try {
      const token = localStorage.getItem("auth-token") || "";
      const r = await fetch("/api/profile/citta", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(form),
      });
      if (r.status === 401) { window.location.href = `/autenticazione?redirect=${encodeURIComponent(window.location.pathname)}`; return; }
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        alert(j?.error || "Errore salvataggio città di lavoro");
        return;
      }
      // Avanza a Servizi
      router.push("/dashboard/escort/compila/servizi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Città di Lavoro" subtitle="Definisci fino a 4 città, zone e posizione esatta sulla mappa" />

      <div className="rounded-xl border border-gray-600 bg-gray-800 p-5 space-y-4">
        {/* Città base e secondarie */}
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Città Base">
            <div className="relative">
              <input
                value={form.baseCity}
                onChange={(e)=>{ setForm((f:any)=>({ ...f, baseCity: e.target.value })); setCityQ(prev=>({ ...prev, baseCity: e.target.value })); }}
                className="inp w-full pr-9"
                placeholder="Es. Milano"
                autoComplete="off"
                onFocus={()=> setOpenCity(p=>({ ...p, baseCity: true }))}
              />
              <button type="button" onClick={()=> setOpenCity(p=>({ ...p, baseCity: !p.baseCity }))} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 grid place-items-center rounded-md bg-gray-700 border border-gray-600 text-gray-300">⌄</button>
              {((cityRes.baseCity||[]).length>0) && (
                <div className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-md border border-gray-600 divide-y divide-gray-700 bg-gray-900">
                  {(cityRes.baseCity||[]).map((it:any, idx:number)=> (
                    <button key={idx} type="button" onClick={()=>{ setForm((f:any)=>({ ...f, baseCity: it.city })); setCityRes(p=>({ ...p, baseCity: [] })); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-800 text-gray-200">{it.city}</button>
                  ))}
                </div>
              )}
              {openCity.baseCity && (cityRes.baseCity||[]).length === 0 && (
                <div className="absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded-md border border-gray-600 divide-y divide-gray-700 bg-gray-900">
                  {COMMON_CITIES.map((c, idx)=> (
                    <button key={idx} type="button" onClick={()=>{ setForm((f:any)=>({ ...f, baseCity: c })); setOpenCity(p=>({ ...p, baseCity: false })); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-800 text-gray-200">{c}</button>
                  ))}
                </div>
              )}
            </div>
          </Field>
          <Field label="Seconda Città">
            <div className="relative">
              <input value={form.secondCity} onChange={(e)=>{ setForm((f:any)=>({ ...f, secondCity: e.target.value })); setCityQ(prev=>({ ...prev, secondCity: e.target.value })); }} className="inp w-full pr-9" placeholder="Es. Monza" autoComplete="off" onFocus={()=> setOpenCity(p=>({ ...p, secondCity: true }))} />
              <button type="button" onClick={()=> setOpenCity(p=>({ ...p, secondCity: !p.secondCity }))} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 grid place-items-center rounded-md bg-gray-700 border border-gray-600 text-gray-300">⌄</button>
              {((cityRes.secondCity||[]).length>0) && (
                <div className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-md border border-gray-600 divide-y divide-gray-700 bg-gray-900">
                  {(cityRes.secondCity||[]).map((it:any, idx:number)=> (
                    <button key={idx} type="button" onClick={()=>{ setForm((f:any)=>({ ...f, secondCity: it.city })); setCityRes(p=>({ ...p, secondCity: [] })); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-800 text-gray-200">{it.city}</button>
                  ))}
                </div>
              )}
              {openCity.secondCity && (cityRes.secondCity||[]).length === 0 && (
                <div className="absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded-md border border-gray-600 divide-y divide-gray-700 bg-gray-900">
                  {COMMON_CITIES.map((c, idx)=> (
                    <button key={idx} type="button" onClick={()=>{ setForm((f:any)=>({ ...f, secondCity: c })); setOpenCity(p=>({ ...p, secondCity: false })); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-800 text-gray-200">{c}</button>
                  ))}
                </div>
              )}
            </div>
          </Field>
          <Field label="Terza Città">
            <div className="relative">
              <input value={form.thirdCity} onChange={(e)=>{ setForm((f:any)=>({ ...f, thirdCity: e.target.value })); setCityQ(prev=>({ ...prev, thirdCity: e.target.value })); }} className="inp w-full pr-9" autoComplete="off" onFocus={()=> setOpenCity(p=>({ ...p, thirdCity: true }))} />
              <button type="button" onClick={()=> setOpenCity(p=>({ ...p, thirdCity: !p.thirdCity }))} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 grid place-items-center rounded-md bg-gray-700 border border-gray-600 text-gray-300">⌄</button>
              {((cityRes.thirdCity||[]).length>0) && (
                <div className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-md border border-gray-600 divide-y divide-gray-700 bg-gray-900">
                  {(cityRes.thirdCity||[]).map((it:any, idx:number)=> (
                    <button key={idx} type="button" onClick={()=>{ setForm((f:any)=>({ ...f, thirdCity: it.city })); setCityRes(p=>({ ...p, thirdCity: [] })); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-800 text-gray-200">{it.city}</button>
                  ))}
                </div>
              )}
              {openCity.thirdCity && (cityRes.thirdCity||[]).length === 0 && (
                <div className="absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded-md border border-gray-600 divide-y divide-gray-700 bg-gray-900">
                  {COMMON_CITIES.map((c, idx)=> (
                    <button key={idx} type="button" onClick={()=>{ setForm((f:any)=>({ ...f, thirdCity: c })); setOpenCity(p=>({ ...p, thirdCity: false })); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-800 text-gray-200">{c}</button>
                  ))}
                </div>
              )}
            </div>
          </Field>
          <Field label="Quarta Città">
            <div className="relative">
              <input value={form.fourthCity} onChange={(e)=>{ setForm((f:any)=>({ ...f, fourthCity: e.target.value })); setCityQ(prev=>({ ...prev, fourthCity: e.target.value })); }} className="inp w-full pr-9" autoComplete="off" onFocus={()=> setOpenCity(p=>({ ...p, fourthCity: true }))} />
              <button type="button" onClick={()=> setOpenCity(p=>({ ...p, fourthCity: !p.fourthCity }))} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 grid place-items-center rounded-md bg-gray-700 border border-gray-600 text-gray-300">⌄</button>
              {((cityRes.fourthCity||[]).length>0) && (
                <div className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-md border border-gray-600 divide-y divide-gray-700 bg-gray-900">
                  {(cityRes.fourthCity||[]).map((it:any, idx:number)=> (
                    <button key={idx} type="button" onClick={()=>{ setForm((f:any)=>({ ...f, fourthCity: it.city })); setCityRes(p=>({ ...p, fourthCity: [] })); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-800 text-gray-200">{it.city}</button>
                  ))}
                </div>
              )}
              {openCity.fourthCity && (cityRes.fourthCity||[]).length === 0 && (
                <div className="absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded-md border border-gray-600 divide-y divide-gray-700 bg-gray-900">
                  {COMMON_CITIES.map((c, idx)=> (
                    <button key={idx} type="button" onClick={()=>{ setForm((f:any)=>({ ...f, fourthCity: c })); setOpenCity(p=>({ ...p, fourthCity: false })); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-800 text-gray-200">{c}</button>
                  ))}
                </div>
              )}
            </div>
          </Field>
        </div>

        {/* Zone per città base */}
        <div>
          <div className="text-sm text-gray-300 mb-1">Seleziona le tue zone (per la città base)</div>
          <div className="space-y-2">
            {(form.zones || []).map((z:string, i:number)=> (
              <div key={i} className="flex items-center gap-2">
                <input value={z} onChange={(e)=>setZoneInput(i, e.target.value)} className="inp flex-1" placeholder={`Zona #${i+1}`} />
                <Button variant="secondary" onClick={()=>removeZone(i)}>Rimuovi</Button>
              </div>
            ))}
            <Button variant="secondary" onClick={addZone}>+ Aggiungi zona</Button>
          </div>
          <div className="text-xs text-gray-500 mt-1">Suggerimento: es. Centro, Navigli, Porta Romana…</div>
        </div>

        {/* Posizione esatta su mappa */}
        <div>
          <div className="text-sm text-gray-300 mb-2">Posizione esatta sulla mappa</div>
          {/* Autocomplete indirizzo (Nominatim) */}
          <div className="grid md:grid-cols-[1fr,auto] gap-2 mb-2">
            <input
              value={addrQuery}
              onChange={(e)=>setAddrQuery(e.target.value)}
              className="inp"
              placeholder="Cerca indirizzo o luogo (es. Via Torino Milano)"
            />
            <Button variant="secondary" onClick={async()=>{
              const q = addrQuery.trim();
              if (!q) { setAddrResults([]); return; }
              setSearching(true);
              try{
                const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6`;
                const r = await fetch(url, { headers: { 'Accept':'application/json' } });
                const j = await r.json();
                if (Array.isArray(j)) setAddrResults(j);
              } finally { setSearching(false); }
            }}>{searching? 'Cerco…':'Cerca'}</Button>
          </div>
          {addrResults.length > 0 && (
            <div className="max-h-56 overflow-auto rounded-md border border-gray-600 mb-2 divide-y divide-gray-700 bg-gray-900">
              {addrResults.map((it:any, idx:number)=> (
                <button
                  key={idx}
                  onClick={()=>{
                    const lat = Number(it.lat); const lon = Number(it.lon);
                    if (Number.isFinite(lat) && Number.isFinite(lon)) {
                      setForm((f:any)=>({ ...f, position: { lat, lng: lon }, baseCity: f.baseCity || (it.display_name?.split(',')[1]?.trim() || '') }));
                      // center marker subito se mappa pronta
                      try { if (markerRef.current) markerRef.current.setLatLng([lat, lon]); if (mapRef.current) mapRef.current.setView([lat, lon], 13); } catch {}
                    }
                    setAddrResults([]);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-800 text-gray-200"
                >{it.display_name}</button>
              ))}
            </div>
          )}
          <div ref={mapDivRef} className="w-full h-[360px] rounded-md overflow-hidden border border-gray-600" />
          <div className="grid md:grid-cols-2 gap-4 mt-2">
            <Field label="Latitudine"><input value={form.position.lat} onChange={(e)=>setForm((f:any)=>({ ...f, position: { ...f.position, lat: Number(e.target.value)||0 } }))} className="inp" /></Field>
            <Field label="Longitudine"><input value={form.position.lng} onChange={(e)=>setForm((f:any)=>({ ...f, position: { ...f.position, lng: Number(e.target.value)||0 } }))} className="inp" /></Field>
          </div>
        </div>

        {/* Disponibilità per */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm text-gray-300">Disponibile per Incall</div>
            <div className="grid grid-cols-2 gap-2">
              <input value={form.availability.incall.address} onChange={(e)=>setForm((f:any)=>({ ...f, availability: { ...f.availability, incall: { ...f.availability.incall, address: e.target.value } } }))} className="inp" placeholder="Indirizzo" />
              <input value={form.availability.incall.cap} onChange={(e)=>setForm((f:any)=>({ ...f, availability: { ...f.availability, incall: { ...f.availability.incall, cap: e.target.value } } }))} className="inp" placeholder="CAP" />
            </div>
            <div className="grid md:grid-cols-2 gap-2">
              <select
                className="inp"
                value={form.availability.incall.type}
                onChange={(e)=>setForm((f:any)=>({ ...f, availability: { ...f.availability, incall: { ...f.availability.incall, type: e.target.value } } }))}
              >
                <option value="">- non selezionato -</option>
                <option value="appartamento_privato">Appartamento privato</option>
                <option value="camera_albergo">Camera d'albergo</option>
                <option value="studio_club">Studio Club</option>
                <option value="altro">Altro (si prega di fornire dettagli)</option>
              </select>
              {form.availability.incall.type === 'altro' && (
                <input className="inp" placeholder="Dettagli incall" value={form.availability.incall.other} onChange={(e)=>setForm((f:any)=>({ ...f, availability: { ...f.availability, incall: { ...f.availability.incall, other: e.target.value } } }))} />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-gray-300">Disponibile per Outcall</div>
            <label className="text-sm text-gray-300 flex items-center gap-2"><input type="checkbox" checked={!!form.availability.outcall?.enabled} onChange={(e)=>setForm((f:any)=>({ ...f, availability: { ...f.availability, outcall: { ...(f.availability.outcall||{}), enabled: e.target.checked } } }))} /> Outcall attivo</label>
            <div className="grid md:grid-cols-2 gap-2">
              <select
                className="inp"
                value={form.availability.outcall?.type || ''}
                onChange={(e)=>setForm((f:any)=>({ ...f, availability: { ...f.availability, outcall: { ...(f.availability.outcall||{}), type: e.target.value } } }))}
                disabled={!form.availability.outcall?.enabled}
              >
                <option value="">- non selezionato -</option>
                <option value="solo_hotel">All'uomo solo in hotel</option>
                <option value="solo_domicilio">All'uomo solo a domicilio</option>
                <option value="domicilio_e_hotel">All'uomo a domicilio e hotel</option>
                <option value="altro">Altro (si prega di fornire dettagli)</option>
              </select>
              {form.availability.outcall?.enabled && form.availability.outcall?.type === 'altro' && (
                <input className="inp" placeholder="Dettagli outcall" value={form.availability.outcall?.other || ''} onChange={(e)=>setForm((f:any)=>({ ...f, availability: { ...f.availability, outcall: { ...(f.availability.outcall||{}), other: e.target.value } } }))} />
              )}
            </div>
          </div>
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
