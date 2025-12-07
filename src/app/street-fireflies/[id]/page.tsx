"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/SectionHeader";

interface StreetEscortPhoto {
  id: number;
  url: string;
  isCensored: boolean;
}

interface StreetEscortDetail {
  id: number;
  name: string;
  city: string;
  shortDescription: string | null;
  fullDescription: string | null;
  price: number | null;
  photos: StreetEscortPhoto[];
}

interface StreetFireflyReviewItem {
  id: number;
  title: string;
  rating: number;
  reviewText: string;
  createdAt: string;
  author?: {
    id: number;
    nome: string | null;
    email: string | null;
  } | null;
}

export default function StreetFireflyDetailPage() {
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<StreetEscortDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMapAccess, setHasMapAccess] = useState(false);
  const [reviews, setReviews] = useState<StreetFireflyReviewItem[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState("");
  const [hasReviewsAccess, setHasReviewsAccess] = useState(false);
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [showPayPal, setShowPayPal] = useState(false);

  // Riusa la stessa logica di /escort/mappa per capire se l'utente ha un pacchetto attivo
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const raw = window.localStorage.getItem("map-access");
      if (!raw) return;
      const data = JSON.parse(raw) as { code?: string; acquiredAt?: string } | null;
      if (!data?.code || !data?.acquiredAt) return;
      const acquired = new Date(data.acquiredAt).getTime();
      if (!Number.isFinite(acquired)) return;
      const now = Date.now();
      const days30 = 30 * 24 * 60 * 60 * 1000;
      if (now - acquired <= days30) {
        setHasMapAccess(true);
      }
    } catch {
      // ignora errori di parsing
    }
  }, []);

  useEffect(() => {
    const id = params?.id;
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/public/street-fireflies?id=${encodeURIComponent(String(id))}`);
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(j?.error || "Profilo non trovato");
          setItem(null);
          return;
        }
        setItem(j.item as StreetEscortDetail);
      } catch (e) {
        console.error(e);
        setError("Errore durante il caricamento del profilo");
        setItem(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [params?.id]);

  useEffect(() => {
    const id = params?.id;
    if (!id) return;
    (async () => {
      try {
        setAccessLoading(true);
        setAccessError(null);
        const token = typeof window !== "undefined" ? window.localStorage.getItem("auth-token") || "" : "";
        if (!token) {
          setHasReviewsAccess(false);
          return;
        }
        const res = await fetch(`/api/street-fireflies/${encodeURIComponent(String(id))}/reviews-access`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          setAccessError(j?.error || "Impossibile verificare l'accesso alle recensioni");
          setHasReviewsAccess(false);
          return;
        }
        setHasReviewsAccess(!!j.hasAccess);
      } catch (e) {
        console.error(e);
        setAccessError("Errore durante la verifica dell'accesso alle recensioni");
        setHasReviewsAccess(false);
      } finally {
        setAccessLoading(false);
      }
    })();
  }, [params?.id]);

  // Carica recensioni approvate per questa Street Firefly
  useEffect(() => {
    const id = params?.id;
    if (!id) return;
    (async () => {
      try {
        setReviewsLoading(true);
        setReviewsError(null);
        const res = await fetch(`/api/street-fireflies/${encodeURIComponent(String(id))}/reviews`);
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          setReviewsError(j?.error || "Impossibile caricare le recensioni");
          setReviews([]);
          return;
        }
        setReviews((j.reviews || []) as StreetFireflyReviewItem[]);
      } catch (e) {
        console.error(e);
        setReviewsError("Errore durante il caricamento delle recensioni");
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    })();
  }, [params?.id]);

  const censoredPhoto = item?.photos?.find((p) => p.isCensored) || item?.photos?.[0] || null;

  function ReviewsPayPalButton() {
    const divRef = useRef<HTMLDivElement | null>(null);
    const buttonsRef = useRef<any>(null);

    useEffect(() => {
      let canceled = false;
      async function load() {
        try {
          if (typeof window === "undefined") return;
          if (!(window as any).paypal) {
            let clientId: string | null = null;
            const envClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
            if (envClientId && String(envClientId).trim().length > 0) {
              clientId = String(envClientId).trim();
            }
            if (!clientId) throw new Error("PayPal non configurato");
            const existing = document.querySelector('script[src^="https://www.paypal.com/sdk/js"]') as HTMLScriptElement | null;
            if (!existing) {
              await new Promise<void>((resolve, reject) => {
                const s = document.createElement("script");
                s.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=EUR`;
                s.async = true;
                s.onload = () => resolve();
                s.onerror = () => reject(new Error("Errore caricamento PayPal"));
                document.body.appendChild(s);
              });
            } else {
              await new Promise<void>((resolve, reject) => {
                existing.addEventListener("load", () => resolve(), { once: true });
                existing.addEventListener("error", () => reject(new Error("Errore caricamento PayPal")), { once: true });
              });
            }
          }
          if (canceled) return;
          if (!(window as any).paypal) return;
          if (!divRef.current) return;
          if (buttonsRef.current) {
            try { buttonsRef.current.close(); } catch {}
            buttonsRef.current = null;
          }
          divRef.current.innerHTML = "";
          const id = params?.id;
          if (!id) return;
          buttonsRef.current = (window as any).paypal.Buttons({
            style: {
              layout: "vertical",
              color: "gold",
              shape: "rect",
              label: "paypal",
              height: 40,
            },
            createOrder: async () => {
              const token = window.localStorage.getItem("auth-token") || "";
              if (!token) throw new Error("Non autenticato");
              const res = await fetch(`/api/street-fireflies/${encodeURIComponent(String(id))}/reviews-paypal-create`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              });
              const j = await res.json().catch(() => ({}));
              if (!res.ok) {
                throw new Error(j?.error || "Errore creazione ordine PayPal");
              }
              return j.orderId;
            },
            onApprove: async (data: any) => {
              try {
                const token = window.localStorage.getItem("auth-token") || "";
                const id = params?.id;
                if (!id) return;
                const res = await fetch(`/api/street-fireflies/${encodeURIComponent(String(id))}/reviews-paypal-capture`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ orderId: data.orderID }),
                });
                const j = await res.json().catch(() => ({}));
                if (!res.ok) {
                  alert(j?.error || "Errore completamento pagamento");
                  return;
                }
                setHasReviewsAccess(true);
                setShowPayPal(false);
              } catch (e) {
                console.error(e);
                alert("Errore durante il completamento del pagamento PayPal");
              }
            },
            onError: (err: any) => {
              console.error("PayPal error", err);
              alert("Errore PayPal. Riprova.");
            },
            onCancel: () => {
              setShowPayPal(false);
            },
          });
          if (divRef.current && buttonsRef.current) {
            try { buttonsRef.current.render(divRef.current); } catch (e) { console.error(e); }
          }
        } catch (e) {
          console.error(e);
          alert("Errore inizializzazione PayPal");
        }
      }
      load();
      return () => {
        canceled = true;
        if (buttonsRef.current) {
          try { buttonsRef.current.close(); } catch {}
          buttonsRef.current = null;
        }
      };
    }, []);

    return (
      <div className="space-y-1">
        <div className="text-xs text-gray-300">Pagamento sicuro tramite PayPal · Importo unico 1,00 € per questo profilo</div>
        <div ref={divRef} />
      </div>
    );
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!params?.id) return;
    if (!reviewTitle.trim() || !reviewText.trim()) {
      alert("Titolo e testo della recensione sono obbligatori");
      return;
    }
    const token = typeof window !== "undefined" ? window.localStorage.getItem("auth-token") || "" : "";
    if (!token) {
      alert("Devi effettuare il login per scrivere una recensione.");
      return;
    }
    try {
      setPosting(true);
      const res = await fetch(`/api/street-fireflies/${encodeURIComponent(String(params.id))}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: reviewTitle.trim(),
          rating: reviewRating,
          reviewText: reviewText.trim(),
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.error) {
        alert(j?.error || "Errore durante l'invio della recensione");
        return;
      }
      // Dopo l'invio, azzera il form e ricarica la lista (anche se la recensione potrebbe essere in moderazione)
      setReviewTitle("");
      setReviewRating(5);
      setReviewText("");
      // Ricarica le recensioni
      try {
        setReviewsLoading(true);
        const resReload = await fetch(`/api/street-fireflies/${encodeURIComponent(String(params.id))}/reviews`);
        const jr = await resReload.json().catch(() => ({}));
        if (resReload.ok) {
          setReviews((jr.reviews || []) as StreetFireflyReviewItem[]);
        }
      } finally {
        setReviewsLoading(false);
      }
      alert("Recensione inviata. Sarà visibile dopo l'approvazione.");
    } catch (err) {
      console.error(err);
      alert("Errore imprevisto durante l'invio della recensione");
    } finally {
      setPosting(false);
    }
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <SectionHeader
        title={item ? item.name : "Street Firefly"}
        subtitle={item?.city ? `Profilo speciale Street Fireflies · ${item.city}` : "Profilo speciale Street Fireflies"}
      />

      {loading && (
        <div className="text-sm text-gray-300">Caricamento profilo…</div>
      )}

      {!loading && error && (
        <div className="text-sm text-red-400">{error}</div>
      )}

      {!loading && !error && item && (
        <div className="mt-4 space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3">
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-gray-700 bg-gray-900 flex items-center justify-center">
                {censoredPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={censoredPhoto.url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-xs text-gray-400 px-3 text-center">
                    Foto gestite dall'amministratore. Il volto può essere parzialmente censurato per privacy.
                  </div>
                )}
                {/* Maschera fissa: sfocatura e oscuramento leggero sulla metà superiore (volto), indipendentemente dal pacchetto */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-black/40 backdrop-blur-md" />
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-xl font-semibold text-white">{item.name}</h2>
                {item.city && (
                  <div className="text-sm text-gray-300">Zona: {item.city}</div>
                )}
              </div>
              {item.shortDescription && (
                <p className="text-sm text-gray-200">{item.shortDescription}</p>
              )}
              {item.price != null && (
                <div className="text-sm text-pink-400 font-semibold">
                  Prezzo indicativo: {item.price} (crediti o EUR, in base alla configurazione)
                </div>
              )}

              <div className="pt-2">
                <p className="mt-2 text-xs text-gray-300">
                  Profilo speciale Street Fireflies: le foto rimangono parzialmente censurate per privacy, ma puoi
                  consultare tutte le informazioni testuali. Le funzionalità di recensione verranno attivate in un
                  passaggio successivo.
                </p>
              </div>
            </div>
          </div>

          {item.fullDescription && (
            <div className="rounded-lg border border-gray-700 bg-gray-900 p-4 text-sm text-gray-200 whitespace-pre-line">
              {item.fullDescription}
            </div>
          )}

          <div className="mt-6 rounded-lg border border-gray-700 bg-gray-900 p-4 space-y-4">
            <h3 className="text-lg font-semibold text-white">Recensioni</h3>

            {accessLoading && (
              <p className="text-xs text-gray-400">Verifica accesso alle recensioni…</p>
            )}
            {accessError && !accessLoading && (
              <p className="text-xs text-red-400">{accessError}</p>
            )}

            {!hasReviewsAccess ? (
              <div className="space-y-3">
                <p className="text-xs text-gray-300">
                  Per leggere le recensioni degli altri utenti su questo profilo è richiesto un pagamento unico di
                  <span className="font-semibold text-white"> 1,00 €</span> tramite PayPal.
                </p>
                <div className="space-y-2">
                  {!showPayPal ? (
                    <button
                      type="button"
                      onClick={() => {
                        const token = typeof window !== "undefined" ? window.localStorage.getItem("auth-token") || "" : "";
                        if (!token) {
                          alert("Devi effettuare il login per procedere con il pagamento.");
                          return;
                        }
                        setShowPayPal(true);
                      }}
                      className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-xs text-white font-semibold"
                    >
                      Sblocca recensioni con PayPal (1,00 €)
                    </button>
                  ) : (
                    <ReviewsPayPalButton />
                  )}
                </div>
                <p className="text-[11px] text-gray-400">
                  Puoi comunque scrivere la tua recensione gratuitamente, anche senza aver sbloccato la lettura di
                  quelle degli altri.
                </p>
              </div>
            ) : (
              <>
                {reviewsLoading ? (
                  <p className="text-xs text-gray-400">Caricamento recensioni…</p>
                ) : reviewsError ? (
                  <p className="text-xs text-red-400">{reviewsError}</p>
                ) : reviews.length === 0 ? (
                  <p className="text-xs text-gray-400">Non ci sono ancora recensioni per questo profilo.</p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {reviews.map((r) => (
                      <div key={r.id} className="rounded border border-gray-700 bg-gray-950/50 p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm font-semibold text-white">{r.title}</div>
                          <div className="text-xs text-yellow-300 font-semibold">
                            {"★".repeat(r.rating)}
                            {"☆".repeat(Math.max(0, 5 - r.rating))}
                          </div>
                        </div>
                        <p className="text-xs text-gray-200 whitespace-pre-line mb-1">{r.reviewText}</p>
                        <div className="flex items-center justify-between text-[10px] text-gray-500">
                          <span>
                            {r.author?.nome || r.author?.email || "Utente"}
                          </span>
                          <span>{String(r.createdAt).split("T")[0]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            
            <div className="pt-2 border-t border-gray-800 mt-2">
              <h4 className="text-sm font-semibold text-white mb-2">Scrivi una recensione</h4>
              <p className="text-[11px] text-gray-400 mb-2">
                Le recensioni vengono moderate prima della pubblicazione. Devono essere rispettose e veritiere.
              </p>
              <form onSubmit={submitReview} className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-gray-300 mb-1">Titolo</label>
                    <input
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      className="w-full px-2 py-1 rounded bg-gray-800 border border-gray-700 text-xs text-white"
                      placeholder="Titolo breve della recensione"
                      maxLength={80}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-300 mb-1">Voto (1-5)</label>
                    <select
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      className="w-full px-2 py-1 rounded bg-gray-800 border border-gray-700 text-xs text-white"
                    >
                      {[5, 4, 3, 2, 1].map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-gray-300 mb-1">Testo della recensione</label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-gray-800 border border-gray-700 text-xs text-white h-24"
                    placeholder="Descrivi la tua esperienza nel rispetto delle regole del sito"
                    maxLength={1000}
                    required
                  />
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={posting}
                    className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs text-white font-medium"
                  >
                    {posting ? "Invio in corso…" : "Invia recensione"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
