"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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
  CENTRO_MASSAGGI: { label: "Centro Massaggi", icon: "💆‍♀️", color: "bg-green-500" }
};

export default function IncontriVelociPage() {
  const [meetings, setMeetings] = useState<QuickMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    loadMeetings();
  }, [selectedCategory, selectedCity]);

  const loadMeetings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'ALL') params.set('category', selectedCategory);
      if (selectedCity !== 'ALL') params.set('city', selectedCity);
      
      const res = await fetch(`/api/quick-meetings?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMeetings(data.meetings || []);
        
        // Estrai città uniche
        const uniqueCities = Array.from(new Set(data.meetings?.map((m: QuickMeeting) => m.city) || []));
        setCities(uniqueCities.sort());
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
        <div className="grid md:grid-cols-2 gap-4">
          {/* Filtro Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Categoria
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
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

          {/* Filtro Città */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Città
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tutte le città</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Statistiche */}
      <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(CATEGORIES).map(([key, cat]) => {
          const count = meetings.filter(m => m.category === key).length;
          return (
            <div key={key} className="p-4 bg-gray-800 rounded-lg border border-gray-700 text-center">
              <div className="text-2xl mb-1">{cat.icon}</div>
              <div className="text-xl font-bold text-white">{count}</div>
              <div className="text-xs text-gray-400">{cat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Lista Annunci */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-400">Caricamento incontri veloci...</div>
        </div>
      ) : meetings.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2">Nessun incontro trovato</div>
          <div className="text-sm text-gray-500">Prova a cambiare i filtri o torna più tardi</div>
        </div>
      ) : (
        <div className="grid gap-6">
          {meetings.map((meeting) => {
            const category = CATEGORIES[meeting.category as keyof typeof CATEGORIES];
            return (
              <div key={meeting.id} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-blue-600 transition-colors">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 text-xs font-bold text-white rounded-full ${category?.color}`}>
                          {category?.icon} {category?.label}
                        </span>
                        {getBumpBadge(meeting.bumpPackage)}
                        <span className="text-xs text-gray-400">
                          {formatTimeAgo(meeting.publishedAt)}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-white mb-2">
                        {meeting.title}
                      </h3>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-300 mb-3">
                        <span>📍 {meeting.city}</span>
                        {meeting.zone && <span>🏘️ {meeting.zone}</span>}
                        {meeting.age && <span>🎂 {meeting.age} anni</span>}
                        {meeting.price && <span>💰 €{meeting.price}</span>}
                      </div>
                      
                      {meeting.description && (
                        <p className="text-gray-400 text-sm line-clamp-3">
                          {meeting.description}
                        </p>
                      )}
                    </div>

                    {/* Foto */}
                    {meeting.photos.length > 0 && (
                      <div className="ml-4 flex-shrink-0">
                        <div className="w-24 h-24 bg-gray-700 rounded-lg overflow-hidden">
                          <img
                            src={meeting.photos[0]}
                            alt={meeting.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.svg';
                            }}
                          />
                        </div>
                        {meeting.photos.length > 1 && (
                          <div className="text-xs text-gray-400 text-center mt-1">
                            +{meeting.photos.length - 1} foto
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Azioni */}
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-700">
                    {meeting.phone && (
                      <a
                        href={`tel:${meeting.phone}`}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
                      >
                        📞 Chiama
                      </a>
                    )}
                    
                    {meeting.whatsapp && (
                      <a
                        href={meeting.whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm font-medium transition-colors"
                      >
                        💬 WhatsApp
                      </a>
                    )}
                    
                    <Link
                      href={`/incontri-veloci/${meeting.id}`}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                    >
                      👁️ Dettagli
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </main>
  );
}
