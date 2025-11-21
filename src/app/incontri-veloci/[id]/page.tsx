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

interface Review {
  id: number;
  title: string;
  rating: number;
  reviewText: string;
  createdAt: string;
  user: {
    nome: string;
  };
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
  CENTRO_MASSAGGI: { label: "Centro Massaggi", icon: "💆‍♀️", color: "bg-green-500" },
  GIGOLO: { label: "Gigolo", icon: "🕺", color: "bg-amber-500" }
};

export default function IncontroVeloceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [meeting, setMeeting] = useState<QuickMeeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewForm, setReviewForm] = useState({ title: '', rating: 5, reviewText: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (params?.id) {
      loadMeeting(params.id as string);
    }
  }, [params]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        prevPhoto();
      } else if (e.key === 'ArrowRight') {
        nextPhoto();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, lightboxIndex]);

  const loadMeeting = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/quick-meetings/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMeeting(data.meeting);
        
        // Traccia visitatore unico
        let sessionId = localStorage.getItem('visitor-session-id');
        if (!sessionId) {
          sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          localStorage.setItem('visitor-session-id', sessionId);
        }
        fetch('/api/track-visitor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'quickMeeting', targetId: id, sessionId })
        }).catch(() => {});

        // Carica recensioni
        loadReviews(id);
      } else if (res.status === 404) {
        router.push('/incontri-veloci');
      }
    } catch (error) {
      console.error('Errore caricamento incontro:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async (id: string) => {
    try {
      const res = await fetch(`/api/quick-meetings/${id}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Errore caricamento recensioni:', error);
    }
  };

  useEffect(() => {
    // Verifica autenticazione
    const token = localStorage.getItem('auth-token');
    setIsAuthenticated(!!token);
  }, []);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meeting) return;

    const token = localStorage.getItem('auth-token');
    if (!token) {
      setReviewMessage('Devi essere autenticato per lasciare una recensione');
      return;
    }

    setSubmittingReview(true);
    setReviewMessage('');

    try {
      const res = await fetch(`/api/quick-meetings/${meeting.id}/reviews`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reviewForm)
      });

      const data = await res.json();

      if (res.ok) {
        setReviewMessage(data.message || 'Recensione inviata con successo!');
        setReviewForm({ title: '', rating: 5, reviewText: '' });
        // Ricarica recensioni dopo 2 secondi
        setTimeout(() => loadReviews(meeting.id.toString()), 2000);
      } else {
        setReviewMessage(data.error || 'Errore durante l\'invio della recensione');
      }
    } catch (error) {
      console.error('Errore invio recensione:', error);
      setReviewMessage('Errore durante l\'invio della recensione');
    } finally {
      setSubmittingReview(false);
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

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextPhoto = () => {
    if (meeting && lightboxIndex < meeting.photos.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
    }
  };

  const prevPhoto = () => {
    if (lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    }
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
          <div className="relative bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
            {typeof meeting.views === 'number' && (
              <div className="absolute top-3 right-3 text-xs font-semibold bg-black/60 text-white px-2 py-1 rounded-full border border-gray-600">
                👁️ {meeting.views}
              </div>
            )}
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
                <div 
                  className="aspect-video bg-gray-700 rounded-lg overflow-hidden cursor-pointer relative group"
                  onClick={() => openLightbox(selectedPhoto)}
                >
                  <img
                    src={meeting.photos[selectedPhoto]}
                    alt={`${meeting.title} - Foto ${selectedPhoto + 1}`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="text-white text-4xl opacity-0 group-hover:opacity-100 transition-opacity">
                      🔍
                    </div>
                  </div>
                </div>
              </div>

              {/* Miniature */}
              {meeting.photos.length > 1 && (
                <div className="grid grid-cols-6 gap-2">
                  {meeting.photos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedPhoto(index);
                        openLightbox(index);
                      }}
                      className={`aspect-square bg-gray-700 rounded-lg overflow-hidden border-2 transition-colors cursor-pointer group relative ${
                        selectedPhoto === index ? 'border-blue-500' : 'border-transparent hover:border-gray-500'
                      }`}
                    >
                      <img
                        src={photo}
                        alt={`Miniatura ${index + 1}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <div className="text-white text-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          🔍
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Statistiche (solo per SuperTop) */}
          {meeting.bumpPackage === 'SUPERTOP' && (
            <div className="bg-gray-800 rounded-lg border border-yellow-500/60 p-6 mt-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-yellow-300">📊</span>
                <span>Statistiche annuncio SuperTop</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm text-gray-200">
                <div className="bg-gray-900/60 rounded-lg p-3 border border-gray-700/80">
                  <div className="text-2xl mb-1">👁️</div>
                  <div className="text-lg font-bold">{meeting.views}</div>
                  <div className="text-xs text-gray-400">Visualizzazioni</div>
                </div>
                <div className="bg-gray-900/60 rounded-lg p-3 border border-gray-700/80">
                  <div className="text-2xl mb-1">⭐</div>
                  <div className="text-lg font-bold">{reviews.length}</div>
                  <div className="text-xs text-gray-400">Recensioni ricevute</div>
                </div>
                <div className="bg-gray-900/40 rounded-lg p-3 border border-gray-800">
                  <div className="text-2xl mb-1">📞</div>
                  <div className="text-lg font-bold">--</div>
                  <div className="text-xs text-gray-500">Chiamate (prossimamente)</div>
                </div>
                <div className="bg-gray-900/40 rounded-lg p-3 border border-gray-800">
                  <div className="text-2xl mb-1">💬</div>
                  <div className="text-lg font-bold">--</div>
                  <div className="text-xs text-gray-500">Contatti chat (prossimamente)</div>
                </div>
              </div>
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

          {/* Sezione Recensioni */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mt-6">
            <h2 className="text-xl font-bold text-white mb-4">⭐ Recensioni</h2>

            {/* Form Nuova Recensione */}
            {isAuthenticated ? (
              <form onSubmit={submitReview} className="mb-6 p-4 bg-gray-700 rounded-lg">
                <h3 className="text-white font-medium mb-3">Scrivi una recensione</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Titolo</label>
                    <input
                      type="text"
                      value={reviewForm.title}
                      onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                      placeholder="Es: Bellissima esperienza!"
                      required
                      minLength={3}
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Valutazione</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                          className={`text-3xl transition-colors ${
                            star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-500'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-1">La tua recensione</label>
                    <textarea
                      value={reviewForm.reviewText}
                      onChange={(e) => setReviewForm({ ...reviewForm, reviewText: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm h-24 resize-none"
                      placeholder="Racconta la tua esperienza..."
                      required
                      minLength={10}
                      maxLength={1000}
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      {reviewForm.reviewText.length}/1000 caratteri
                    </div>
                  </div>

                  {reviewMessage && (
                    <div className={`text-sm p-2 rounded ${
                      reviewMessage.includes('successo') 
                        ? 'bg-green-900/30 text-green-300 border border-green-600/30' 
                        : 'bg-red-900/30 text-red-300 border border-red-600/30'
                    }`}>
                      {reviewMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded font-medium transition-colors"
                  >
                    {submittingReview ? 'Invio...' : '📝 Invia Recensione'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mb-6 p-4 bg-gray-700 rounded-lg text-center">
                <p className="text-gray-300 mb-3">Devi essere autenticato per lasciare una recensione</p>
                <Link href="/autenticazione" className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium">
                  Accedi o Registrati
                </Link>
              </div>
            )}

            {/* Lista Recensioni */}
            {reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div key={review.id} className="p-4 bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-white">{review.title}</span>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-500'}>
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          di <span className="font-medium">{review.user.nome}</span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mt-2">{review.reviewText}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-2">💬</div>
                <div className="text-sm">Nessuna recensione ancora</div>
                <div className="text-xs mt-1">Sii il primo a lasciare una recensione!</div>
              </div>
            )}
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

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 transition-colors z-10"
          >
            ×
          </button>

          {/* Freccia Sinistra */}
          {lightboxIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
              className="absolute left-4 text-white text-5xl hover:text-gray-300 transition-colors z-10"
            >
              ‹
            </button>
          )}

          {/* Immagine */}
          <div className="max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={meeting.photos[lightboxIndex]}
              alt={`${meeting.title} - Foto ${lightboxIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
          </div>

          {/* Freccia Destra */}
          {lightboxIndex < meeting.photos.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
              className="absolute right-4 text-white text-5xl hover:text-gray-300 transition-colors z-10"
            >
              ›
            </button>
          )}

          {/* Contatore foto */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full">
            {lightboxIndex + 1} / {meeting.photos.length}
          </div>
        </div>
      )}
    </main>
  );
}
