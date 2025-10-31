"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface ImportedReview {
  id: number;
  escortName: string;
  reviewerName?: string;
  rating?: number;
  reviewText?: string;
  reviewDate?: string;
  sourceUrl?: string;
}

interface QuickMeeting {
  id: number;
  title: string;
  description?: string;
  category: string;
  city: string;
  zone?: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  age?: number;
  price?: number;
  photos: string[];
  publishedAt: string;
  bumpPackage?: string;
  views: number;
  importedReviews?: ImportedReview[];
  reviewCount?: number;
}

const CATEGORIES = {
  DONNA_CERCA_UOMO: { label: "Donna cerca Uomo", icon: "👩‍❤️‍👨", color: "bg-pink-500" },
  TRANS: { label: "Trans", icon: "🏳️‍⚧️", color: "bg-purple-500" },
  UOMO_CERCA_UOMO: { label: "Uomo cerca Uomo", icon: "👨‍❤️‍👨", color: "bg-blue-500" },
  CENTRO_MASSAGGI: { label: "Centro Massaggi", icon: "💆‍♀️", color: "bg-green-500" }
};

export default function IncontroVeloceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [meeting, setMeeting] = useState<QuickMeeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(0);

  useEffect(() => {
    if (params?.id) {
      loadMeeting(params.id as string);
    }
  }, [params]);

  const loadMeeting = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/quick-meetings/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMeeting(data.meeting);
        
        // Incrementa visualizzazioni
        fetch(`/api/quick-meetings/${id}/view`, { method: 'POST' }).catch(() => {});
      } else if (res.status === 404) {
        router.push('/incontri-veloci');
      }
    } catch (error) {
      console.error('Errore caricamento incontro:', error);
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
      <span className={`px-3 py-1 text-sm font-bold text-white rounded-full ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-gray-400">Caricamento incontro...</div>
        </div>
      </main>
    );
  }

  if (!meeting) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">Incontro non trovato</div>
          <Link href="/incontri-veloci" className="text-blue-400 hover:underline">
            ← Torna agli Incontri Veloci
          </Link>
        </div>
      </main>
    );
  }

  const category = CATEGORIES[meeting.category as keyof typeof CATEGORIES];

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/incontri-veloci" className="text-blue-400 hover:underline">
          ← Incontri Veloci
        </Link>
        <span className="text-gray-500 mx-2">›</span>
        <span className="text-white">{meeting.title}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Contenuto principale */}
        <div className="lg:col-span-2">
          {/* Header */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 text-sm font-bold text-white rounded-full ${category?.color}`}>
                {category?.icon} {category?.label}
              </span>
              {getBumpBadge(meeting.bumpPackage)}
              <span className="text-sm text-gray-400">
                {formatTimeAgo(meeting.publishedAt)}
              </span>
            </div>

            <h1 className="text-3xl font-bold text-white mb-4">{meeting.title}</h1>

            <div className="flex flex-wrap items-center gap-4 text-gray-300 mb-4">
              <span className="flex items-center gap-1">
                📍 <strong>{meeting.city}</strong>
              </span>
              {meeting.zone && (
                <span className="flex items-center gap-1">
                  🏘️ {meeting.zone}
                </span>
              )}
              {meeting.age && (
                <span className="flex items-center gap-1">
                  🎂 {meeting.age} anni
                </span>
              )}
              {meeting.price && (
                <span className="flex items-center gap-1">
                  💰 <strong>€{meeting.price}</strong>
                </span>
              )}
              <span className="flex items-center gap-1">
                👁️ {meeting.views} visualizzazioni
              </span>
            </div>

            {meeting.description && (
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 whitespace-pre-wrap">{meeting.description}</p>
              </div>
            )}
          </div>

          {/* Galleria Foto */}
          {meeting.photos.length > 0 && (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <h2 className="text-xl font-bold text-white mb-4">📸 Foto ({meeting.photos.length})</h2>
              
              {/* Foto principale */}
              <div className="mb-4">
                <div className="aspect-video bg-gray-700 rounded-lg overflow-hidden">
                  <img
                    src={meeting.photos[selectedPhoto]}
                    alt={`${meeting.title} - Foto ${selectedPhoto + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                </div>
              </div>

              {/* Miniature */}
              {meeting.photos.length > 1 && (
                <div className="grid grid-cols-6 gap-2">
                  {meeting.photos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedPhoto(index)}
                      className={`aspect-square bg-gray-700 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedPhoto === index ? 'border-blue-500' : 'border-transparent hover:border-gray-500'
                      }`}
                    >
                      <img
                        src={photo}
                        alt={`Miniatura ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sezione Recensioni */}
          {meeting.importedReviews && meeting.importedReviews.length > 0 && (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mt-6">
              <h2 className="text-xl font-bold text-white mb-4">
                ⭐ Recensioni ({meeting.importedReviews.length})
              </h2>
              
              <div className="space-y-4">
                {meeting.importedReviews.map((review) => (
                  <div key={review.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">
                          {review.reviewerName || 'Utente anonimo'}
                        </span>
                        {review.rating && (
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={i < review.rating! ? 'text-yellow-400' : 'text-gray-500'}>
                                ★
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {review.reviewDate && (
                        <span className="text-xs text-gray-400">
                          {new Date(review.reviewDate).toLocaleDateString('it-IT')}
                        </span>
                      )}
                    </div>
                    
                    {review.reviewText && (
                      <p className="text-gray-300 text-sm mb-2">{review.reviewText}</p>
                    )}
                    
                    {review.sourceUrl && (
                      <a
                        href={review.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:underline"
                      >
                        Fonte: Escort Advisor →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Contatti */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 sticky top-4">
            <h2 className="text-xl font-bold text-white mb-4">📞 Contatti</h2>
            
            <div className="space-y-3">
              {meeting.phone && (
                <a
                  href={`tel:${meeting.phone}`}
                  className="flex items-center gap-3 w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  📞 <span>Chiama ora</span>
                </a>
              )}
              
              {meeting.whatsapp && (
                <a
                  href={meeting.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                >
                  💬 <span>WhatsApp</span>
                </a>
              )}
              
              {meeting.telegram && (
                <a
                  href={meeting.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  ✈️ <span>Telegram</span>
                </a>
              )}
            </div>

            {/* Info Bump */}
            {meeting.bumpPackage && (
              <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                <h3 className="font-semibold text-white mb-2">🚀 Pacchetto Attivo</h3>
                <div className="text-sm text-gray-300">
                  Questo annuncio ha un pacchetto {getBumpBadge(meeting.bumpPackage)} attivo
                  e viene automaticamente promosso in prima pagina.
                </div>
              </div>
            )}

            {/* Avviso */}
            <div className="mt-6 p-4 bg-yellow-900/30 border border-yellow-600/30 rounded-lg">
              <div className="text-sm text-yellow-200">
                ⚠️ <strong>Attenzione:</strong> Verifica sempre l'identità della persona prima di incontrarti. 
                IncontriEscort non è responsabile per gli incontri organizzati tramite questi annunci.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Annunci correlati */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-white mb-6">Altri incontri in {meeting.city}</h2>
        <div className="text-gray-400">
          <Link href={`/incontri-veloci?city=${meeting.city}&category=${meeting.category}`} className="text-blue-400 hover:underline">
            Vedi tutti gli incontri {category?.label.toLowerCase()} a {meeting.city} →
          </Link>
        </div>
      </div>
    </main>
  );
}
