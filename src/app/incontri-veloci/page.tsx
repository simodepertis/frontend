"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Watermark from "@/components/Watermark";
import { COUNTRIES_CITIES, COUNTRY_LIST } from "@/lib/internationalCities";
import { CITIES_ORDER } from "@/lib/cities";
import SeoHead from "@/components/SeoHead";

interface QuickMeeting {
  id: number;
  title: string;
  artistName?: string | null;
  description?: string;
  category: string;
  city: string;
  zone?: string;
  phone?: string;
  whatsapp?: string;
  age?: number;
  price?: number;
  photos: string[];
  publishedAt: string;
  bumpPackage?: string;
  avgRating?: number | null;
  reviewCount?: number;
  userId?: number | null;
  user?: { nome?: string | null } | null;
}

function Star({ filled }: { filled: boolean }) {
  return <span className={filled ? 'text-yellow-400' : 'text-gray-500'}>★</span>;
}

function HalfStar() {
  return (
    <span className="relative inline-block">
      <span className="text-gray-500">★</span>
      <span className="absolute left-0 top-0 overflow-hidden text-yellow-400" style={{ width: '50%' }}>
        ★
      </span>
    </span>
  );
}

function Stars({ value }: { value: number }) {
  const v = Math.max(0, Math.min(5, value));
  const full = Math.floor(v);
  const hasHalf = v - full >= 0.5;
  const empty = 5 - full - (hasHalf ? 1 : 0);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f-${i}`} filled={true} />
      ))}
      {hasHalf ? <HalfStar /> : null}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e-${i}`} filled={false} />
      ))}
    </div>
  );
}

function normalizeUploadUrl(u: string | null | undefined): string {
  const s = String(u || '');
  if (!s) return '/placeholder.svg';
  if (s.startsWith('/uploads/')) return `/api${s}`;
  return s;
}

const CATEGORIES = {
  DONNA_CERCA_UOMO: { label: "Donna cerca Uomo", icon: "👩‍❤️‍👨", color: "bg-pink-500" },
  TRANS: { label: "Trans", icon: "🏳️‍⚧️", color: "bg-purple-500" },
  UOMO_CERCA_UOMO: { label: "Uomo cerca Uomo", icon: "👨‍❤️‍👨", color: "bg-blue-500" },
  CENTRO_MASSAGGI: { label: "Centro Massaggi", icon: "💆‍♀️", color: "bg-green-500" },
  GIGOLO: { label: "Gigolo", icon: "🕺", color: "bg-amber-500" }
};

function getBumpBadge(bumpPackage?: string) {
  if (!bumpPackage) return null;

  const badges: Record<string, { label: string; color: string }> = {
    '1+1': { label: 'BUMP 2gg', color: 'bg-yellow-500' },
    '1+3': { label: 'BUMP 4gg', color: 'bg-orange-500' },
    '1+7': { label: 'BUMP 8gg', color: 'bg-red-500' },
    '1x10': { label: 'NOTTURNO 10x', color: 'bg-purple-600' },
    '1x3': { label: 'NOTTURNO 3x', color: 'bg-indigo-600' },
    SUPERTOP: { label: 'SUPERTOP', color: 'bg-yellow-400 text-black' },
  };

  const badge = badges[bumpPackage];
  if (!badge) return null;

  return (
    <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${badge.color}`}>
      {badge.label}
    </span>
  );
}

function normalizePhone(s: string) {
  return String(s || '').replace(/\s+/g, '').replace(/[^0-9+]/g, '');
}

function getSuperTopDisplayName(title: string) {
  const t = String(title || '').trim();
  if (!t) return '';
  const head = t.split(/\s[-–—|•·:]\s|\||·|•|—|–|-/)[0]?.trim();
  const base = (head || t).trim();
  return base.split(/\s+/)[0] || base;
}

function formatLocation(city: string, zone?: string | null) {
  const clean = (input: string, opts?: { maxWords?: number; maxChars?: number }) => {
    let s = String(input || '').trim();
    if (!s) return '';
    // keep only the leading location chunk (avoid appended phrases)
    s = s.split(/\s*(?:\||\/|\\|\n|\r|,|\.|;|:|—|–|-|·)\s*/)[0] || s;
    // collapse whitespace
    s = s.replace(/\s+/g, ' ').trim();
    // remove consecutive duplicate words (case-insensitive)
    const parts = s.split(' ');
    const out: string[] = [];
    for (const p of parts) {
      const prev = out[out.length - 1];
      if (prev && prev.toLowerCase() === p.toLowerCase()) continue;
      const low = p.toLowerCase();
      if (
        low.includes('pompino') ||
        low.includes('venuta') ||
        low.includes('sbor') ||
        low.includes('scop') ||
        low.includes('sexy')
      ) {
        break;
      }
      out.push(p);
    }

    // remove spurious trailing token sometimes appended by imports
    if (out.length > 0 && out[out.length - 1].toLowerCase() === 'super') {
      out.pop();
    }

    const maxWords = Math.max(1, opts?.maxWords ?? 4);
    const maxChars = Math.max(10, opts?.maxChars ?? 40);
    const limited = out.slice(0, maxWords).join(' ').trim();
    return limited.length > maxChars ? limited.slice(0, maxChars).trim() : limited;
  };

  const c = clean(city, { maxWords: 4, maxChars: 40 });
  let z = clean(zone || '', { maxWords: 12, maxChars: 90 });
  if (!c && !z) return '';
  if (!z) return c;
  if (!c) return z;
  // if zone starts with city, remove city prefix from zone
  if (z.toLowerCase().startsWith(c.toLowerCase() + ' ')) {
    z = z.slice(c.length).trim();
  }
  if (c.toLowerCase() === z.toLowerCase()) return c;
  return `${c} · ${z}`;
}

export default function IncontriVelociPage() {
  const [meetings, setMeetings] = useState<QuickMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<number>(1);
  const [pages, setPages] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [phoneQ, setPhoneQ] = useState<string>('');
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  useEffect(() => {
    loadMeetings();
  }, [selectedCategory, selectedCity, phoneQ, page]);

  // Aggiorna le città disponibili quando cambia la nazione
  useEffect(() => {
    if (selectedCountry === 'ALL') {
      setAvailableCities([]);
    } else if (selectedCountry === 'IT') {
      setAvailableCities(CITIES_ORDER);
    } else {
      const countryData = COUNTRIES_CITIES[selectedCountry];
      setAvailableCities(countryData ? countryData.cities : []);
    }
    // Reset città quando cambia nazione
    setSelectedCity('ALL');
  }, [selectedCountry]);

  const loadMeetings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'ALL') params.set('category', selectedCategory);
      if (selectedCity !== 'ALL') params.set('city', selectedCity);
      if (phoneQ.trim()) params.set('phone', phoneQ.trim());
      params.set('limit', '25');
      params.set('page', String(page));
      
      const res = await fetch(`/api/quick-meetings?${params}`);
      if (res.ok) {
        const data = await res.json();
        const superTop = Array.isArray(data.superTopMeetings) ? data.superTopMeetings : [];
        const normal = Array.isArray(data.meetings) ? data.meetings : [];
        // merge without duplicates (superTop first)
        const seen = new Set<number>();
        const merged = [...superTop, ...normal].filter((m: any) => {
          const id = Number(m?.id);
          if (!Number.isFinite(id)) return false;
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
        setMeetings(merged);
        if (data.pagination) {
          setPages(data.pagination.pages || 1);
        } else {
          setPages(1);
        }
      }
    } catch (error) {
      console.error('Errore caricamento incontri:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins} min fa`;
    if (diffHours < 24) return `${diffHours}h fa`;
    return `${diffDays}g fa`;
  };

  const getBumpBadge = (bumpPackage?: string) => {
    if (!bumpPackage) return null;

    const badges = {
      '1+1': { label: 'BUMP 2gg', color: 'bg-yellow-500' },
      '1+3': { label: 'BUMP 4gg', color: 'bg-orange-500' },
      '1+7': { label: 'BUMP 8gg', color: 'bg-red-500' },
      '1x10': { label: 'NOTTURNO 10x', color: 'bg-purple-600' },
      '1x3': { label: 'NOTTURNO 3x', color: 'bg-indigo-600' },
      SUPERTOP: { label: 'SUPERTOP', color: 'bg-yellow-400' },
    };

    const badge = badges[bumpPackage as keyof typeof badges];
    if (!badge) return null;

    return (
      <span className={`px-2 py-1 text-xs font-bold text-white rounded-full ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <>
      <SeoHead
        title="Incontri Veloci | Incontriescort.org"
        description="Annunci di incontri immediati aggiornati in tempo reale. Filtra per città e categoria."
        canonicalPath="/incontri-veloci"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Incontri Veloci",
          url: (process.env.NEXT_PUBLIC_SITE_URL || "https://incontriescort.org") + "/incontri-veloci",
        }}
      />
    <main className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-4"> Incontri Veloci</h1>
        <p className="text-gray-300 text-lg">
          Annunci di incontri immediati aggiornati in tempo reale. Trova quello che cerchi nella tua città.
        </p>
      </div>

      {/* Filtri */}
      <div className="mb-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
        <div className="grid md:grid-cols-4 gap-4">
          {/* Filtro Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Categoria
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setPage(1);
                setSelectedCategory(e.target.value);
              }}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tutte le categorie</option>
              {Object.entries(CATEGORIES).map(([key, cat]) => (
                <option key={key} value={key}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Telefono */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Telefono
            </label>
            <input
              value={phoneQ}
              onChange={(e) => {
                setPage(1);
                setPhoneQ(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  setPage(1);
                  loadMeetings();
                }
              }}
              placeholder="Es. 3331234567"
              inputMode="tel"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-1 text-xs text-gray-400">
              Cerca per telefono o WhatsApp (anche parziale)
            </div>
          </div>

          {/* Filtro Nazione */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nazione
            </label>
            <select
              value={selectedCountry}
              onChange={(e) => {
                setPage(1);
                setSelectedCountry(e.target.value);
              }}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tutte le nazioni</option>
              <option value="IT"> Italia</option>
              {COUNTRY_LIST.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Città */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Città
            </label>
            <select
              value={selectedCity}
              onChange={(e) => {
                setPage(1);
                setSelectedCity(e.target.value);
              }}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500"
              disabled={selectedCountry === 'ALL'}
            >
              <option value="ALL">
                {selectedCountry === 'ALL' ? 'Seleziona prima una nazione' : 'Tutte le città'}
              </option>
              {availableCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>
        {selectedCountry === 'ALL' && (
          <div className="mt-3 text-sm text-gray-400">
            Seleziona una nazione per filtrare per città specifica
          </div>
        )}
      </div>

      {/* Sezione SuperTop */}
      {meetings.some((m) => m.bumpPackage === 'SUPERTOP') && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              <span className="text-yellow-300"></span>
              Annunci SuperTop
            </h2>
            <p className="text-xs md:text-sm text-gray-400">Sempre in alto, visibilità massima</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[320px]">
            {meetings
              .filter((m) => m.bumpPackage === 'SUPERTOP')
              .map((meeting) => {
                const category = CATEGORIES[meeting.category as keyof typeof CATEGORIES];
                const cover = normalizeUploadUrl(meeting.photos?.[0]);
                const phone = normalizePhone(meeting.phone || '');
                const whatsapp = normalizePhone(meeting.whatsapp || meeting.phone || '');
                const displayName =
                  String(meeting.artistName || '').trim() ||
                  getSuperTopDisplayName(meeting.title) ||
                  (meeting.user?.nome || '').trim();
                return (
                  <Link
                    key={`super-${meeting.id}`}
                    href={`/incontri-veloci/${meeting.id}`}
                    className="block group"
                  >
                    <div className="h-full bg-gray-800 rounded-xl border-2 border-yellow-400 shadow-lg shadow-yellow-500/20 overflow-hidden hover:border-yellow-300 hover:bg-gray-750 transition-colors flex flex-col relative">
                      <>
                        <div className="relative w-full h-44 bg-gray-700 overflow-hidden flex-shrink-0">
                          <img
                            src={cover || '/placeholder.svg'}
                            alt={meeting.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.svg';
                            }}
                          />
                          {cover && cover !== '/placeholder.svg' ? <Watermark /> : <Watermark variant="cover" />}
                          <div className="absolute top-2 left-2">
                            {getBumpBadge('SUPERTOP')}
                          </div>
                          <div className="absolute bottom-2 left-2 flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-[11px] font-bold text-white rounded-full ${category?.color}`}>
                              {category?.label}
                            </span>
                            <span className="text-[11px] text-gray-200 bg-black/60 px-2 py-0.5 rounded-full">
                              {formatTimeAgo(meeting.publishedAt)}
                            </span>
                          </div>
                        </div>
                        <div className="p-3 space-y-2 flex-1 flex flex-col">
                          <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-yellow-300">
                            {displayName || meeting.title}
                          </h3>
                          <div className="text-[11px] text-gray-300">
                            {formatLocation(meeting.city, meeting.zone)}
                          </div>

                          <div className="mt-auto">
                            {(phone || whatsapp) && (
                              <div className="flex items-center gap-2 pt-1">
                                {phone && (
                                  <a
                                    href={`tel:${phone}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="px-2 py-1 text-[11px] font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white"
                                  >
                                    Chiama
                                  </a>
                                )}
                                {whatsapp && (
                                  <a
                                    href={`https://wa.me/${whatsapp.replace('+','')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="px-2 py-1 text-[11px] font-semibold rounded bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    WhatsApp
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="absolute bottom-2 right-3 flex items-center gap-1">
                          <Stars value={5} />
                        </div>
                      </>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>
      )}

      {/* Contenitore annunci normali + paginazione leggermente più stretto per lasciare spazio a destra */}
      <div className="max-w-6xl mx-auto lg:mx-0">
        {/* Lista annunci normali (non SuperTop) */}
        <div className="space-y-4">
          {meetings
            .filter((m) => m.bumpPackage !== 'SUPERTOP')
            .map((meeting) => {
              const category = CATEGORIES[meeting.category as keyof typeof CATEGORIES];
              const cover = normalizeUploadUrl(meeting.photos?.[0]);
              return (
                <Link key={meeting.id} href={`/incontri-veloci/${meeting.id}`} className="block group">
                  <div className="bg-gray-800 rounded-xl border border-gray-700 p-3 hover:border-gray-600 transition-colors relative">
                    <div className="flex gap-3 items-stretch">
                      {/* Foto a sinistra, formato quadrato piccolo */}
                      <div className="w-24 h-24 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0 relative">
                        {meeting.photos[0] ? (
                          <>
                            <img
                              src={cover}
                              alt={meeting.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.svg';
                              }}
                            />
                            <Watermark className="[&_span]:text-[9px]" />
                          </>
                        ) : (
                          <>
                            <img
                              src="/placeholder.svg"
                              alt={meeting.title}
                              className="w-full h-full object-cover"
                            />
                            <Watermark variant="cover" />
                          </>
                        )}
                      </div>

                      {/* Testo e dettagli a destra */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`px-2 py-0.5 text-[11px] font-bold text-white rounded-full ${category?.color}`}>
                              {category?.label}
                            </span>
                            <div className="flex items-center gap-2">
                              {getBumpBadge(meeting.bumpPackage)}
                              <span className="text-[11px] text-gray-400">{formatTimeAgo(meeting.publishedAt)}</span>
                            </div>
                          </div>
                          <h3 className="text-sm font-semibold text-white line-clamp-1 group-hover:text-blue-300">
                            {meeting.title}
                          </h3>
                          <div className="text-[11px] text-gray-300">
                            {formatLocation(meeting.city, meeting.zone)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {typeof meeting.avgRating === 'number' && meeting.avgRating > 0 ? (
                      <div className="absolute bottom-2 right-3 flex items-center gap-1">
                        <Stars value={meeting.avgRating} />
                      </div>
                    ) : null}
                  </div>
                </Link>
              );
            })}
        </div>

        {/* Paginazione */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 rounded bg-gray-800 border border-gray-700 text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700"
            >
              ← Pagina precedente
            </button>
            <span className="text-sm text-gray-300">
              Pagina {page} di {pages}
            </span>
            <button
              type="button"
              disabled={page >= pages}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              className="px-4 py-2 rounded bg-gray-800 border border-gray-700 text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700"
            >
              Pagina successiva →
            </button>
          </div>
        )}
      </div>
    </main>
    </>
  );
}
