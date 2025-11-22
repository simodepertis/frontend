"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { COUNTRIES_CITIES, COUNTRY_LIST } from "@/lib/internationalCities";
import { CITIES_ORDER } from "@/lib/cities";

interface QuickMeeting {
  id: number;
  title: string;
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
}

const CATEGORIES = {
  DONNA_CERCA_UOMO: { label: "Donna cerca Uomo", icon: "👩‍❤️‍👨", color: "bg-pink-500" },
  TRANS: { label: "Trans", icon: "🏳️‍⚧️", color: "bg-purple-500" },
  UOMO_CERCA_UOMO: { label: "Uomo cerca Uomo", icon: "👨‍❤️‍👨", color: "bg-blue-500" },
  CENTRO_MASSAGGI: { label: "Centro Massaggi", icon: "💆‍♀️", color: "bg-green-500" },
  GIGOLO: { label: "Gigolo", icon: "🕺", color: "bg-amber-500" }
};

export default function IncontriVelociPage() {
  const [meetings, setMeetings] = useState<QuickMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<number>(1);
  const [pages, setPages] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  useEffect(() => {
    loadMeetings();
  }, [selectedCategory, selectedCity, page]);

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
      params.set('limit', '25');
      params.set('page', String(page));
      
      const res = await fetch(`/api/quick-meetings?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMeetings(data.meetings || []);
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
      '1x3': { label: 'NOTTURNO 3x', color: 'bg-indigo-600' }
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
    <main className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">⚡ Incontri Veloci</h1>
        <p className="text-gray-300 text-lg">
          Annunci di incontri immediati aggiornati in tempo reale. Trova quello che cerchi nella tua città.
        </p>
      </div>

      {/* Filtri */}
      <div className="mb-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
        <div className="grid md:grid-cols-3 gap-4">
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
              <option value="IT">🇮🇹 Italia</option>
              {COUNTRY_LIST.map(country => (
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
              <option value="ALL">{selectedCountry === 'ALL' ? 'Seleziona prima una nazione' : 'Tutte le città'}</option>
              {availableCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>
        {selectedCountry === 'ALL' && (
          <div className="mt-3 text-sm text-gray-400">
            💡 Seleziona una nazione per filtrare per città specifica
          </div>
        )}
      </div>

      {/* Sezione SuperTop */}
      {meetings.some(m => m.bumpPackage === 'SUPERTOP') && (
        <>
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              <span className="text-yellow-300">💎</span>
              Annunci SuperTop
            </h2>
            <p className="text-xs md:text-sm text-gray-400">Sempre in alto, visibilità massima</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {meetings.filter(m => m.bumpPackage === 'SUPERTOP').map((meeting) => {
              const category = CATEGORIES[meeting.category as keyof typeof CATEGORIES];
              return (
                <Link
                  key={`super-${meeting.id}`}
                  href={`/incontri-veloci/${meeting.id}`}
                  className="block group"
                >
                  <div className="bg-gray-800 rounded-xl border-2 border-yellow-400 shadow-lg shadow-yellow-500/20 overflow-hidden hover:border-yellow-300 hover:bg-gray-750 transition-colors">
                    {meeting.photos.length > 0 && (
                      <div className="relative w-full h-44 bg-gray-700 overflow-hidden">
                        <img
                          src={meeting.photos[0]}
                          alt={meeting.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                        <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-semibold bg-black/70 text-yellow-300 flex items-center gap-1">
                          💎 SuperTop
                        </div>
                      </div>
                    )}
                    <div className="p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2 py-0.5 text-[11px] font-bold text-white rounded-full ${category?.color}`}>
                          {category?.label}
                        </span>
                        <span className="text-[11px] text-gray-400">{formatTimeAgo(meeting.publishedAt)}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-white line-clamp-1 group-hover:text-yellow-300">
                        {meeting.title}
                      </h3>
                      <div className="text-[11px] text-gray-300 flex flex-wrap gap-2">
                        <span>📍 {meeting.city}</span>
                        {meeting.zone && <span>🏘️ {meeting.zone}</span>}
                        {meeting.age && <span>🎂 {meeting.age} anni</span>}
                      </div>

                      {(meeting.phone || meeting.whatsapp) && (
                        <div className="pt-1 flex gap-2">
                          {meeting.phone && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (typeof window !== 'undefined') {
                                  window.location.href = `tel:${meeting.phone}`;
                                }
                              }}
                              className="flex-1 px-2 py-1 rounded-md bg-green-600 hover:bg-green-700 text-white text-[11px] font-semibold flex items-center justify-center gap-1"
                            >
                              <span>📞</span>
                              <span>Chiama</span>
                            </button>
                          )}
                          {meeting.whatsapp && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (typeof window !== 'undefined') {
                                  window.open(meeting.whatsapp as string, '_blank');
                                }
                              }}
                              className="flex-1 px-2 py-1 rounded-md bg-green-500 hover:bg-green-600 text-white text-[11px] font-semibold flex items-center justify-center gap-1"
                            >
                              <span>💬</span>
                              <span>WhatsApp</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
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
        </>
      )}

    </main>
  );
}
