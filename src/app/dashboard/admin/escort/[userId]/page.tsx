"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SectionHeader from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";

interface AdminEscortProfile {
  id: number;
  nome: string | null;
  email: string;
  ruolo: string;
  createdAt: string;
  escortProfile: {
    bioIt: string | null;
  } | null;
  photos: { id: number; url: string; status: string }[];
  documents: { id: number; status: string }[];
}

export default function AdminEscortDetailPage() {
  const params = useParams();
  const userId = Number(params?.userId || 0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<AdminEscortProfile | null>(null);
  const [bioIt, setBioIt] = useState("");
  const [deletingPhotoId, setDeletingPhotoId] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;
        const res = await fetch(`/api/admin/escort-profile?userId=${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setError(j?.error || "Errore caricamento profilo escort");
          return;
        }
        const j = await res.json();
        const u: AdminEscortProfile = j.user;
        setUser(u);
        setBioIt(u.escortProfile?.bioIt || "");
      } catch (e) {
        console.error(e);
        setError("Errore imprevisto");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  async function save() {
    if (!userId) return;
    setSaving(true);
    setError(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;
      const res = await fetch("/api/admin/escort-profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId, profile: { bioIt } }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) {
        setError(j?.error || "Errore salvataggio profilo escort");
        return;
      }
      alert("Profilo escort aggiornato");
    } catch (e) {
      console.error(e);
      setError("Errore imprevisto durante il salvataggio");
    } finally {
      setSaving(false);
    }
  }

  async function deletePhoto(photoId: number) {
    if (!user) return;
    if (!window.confirm("Sei sicuro di voler eliminare questa foto?")) return;
    try {
      setDeletingPhotoId(photoId);
      setError(null);
      const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;
      const res = await fetch(`/api/admin/media/photos?id=${photoId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.error) {
        setError(j?.error || "Errore durante l'eliminazione della foto");
        return;
      }
      setUser({
        ...user,
        photos: user.photos.filter((p) => p.id !== photoId),
      });
    } catch (e) {
      console.error(e);
      setError("Errore imprevisto durante l'eliminazione della foto");
    } finally {
      setDeletingPhotoId(null);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Gestione Profilo Escort (Admin)"
        subtitle={userId ? `User #${userId}` : "userId mancante"}
      />

      {loading ? (
        <div className="text-gray-400">Caricamento profilo escort…</div>
      ) : error ? (
        <div className="text-red-400 text-sm">{error}</div>
      ) : !user ? (
        <div className="text-gray-400">Profilo non trovato</div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Colonna sinistra: dati utente */}
          <div className="md:col-span-1 space-y-4">
            <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 text-sm space-y-2">
              <div>
                <div className="text-xs text-gray-400">Nome</div>
                <div className="text-white font-semibold">{user.nome || "(senza nome)"}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Email</div>
                <div className="text-gray-200">{user.email}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Ruolo</div>
                <div className="text-gray-200">{user.ruolo}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Creato il</div>
                <div className="text-gray-200">{user.createdAt?.split("T")[0] || ""}</div>
              </div>
              <div className="pt-2 border-t border-gray-700 mt-2 text-xs text-gray-400 space-y-1">
                <div>Foto totali: {user.photos.length}</div>
                <div>Documenti totali: {user.documents.length}</div>
              </div>
            </div>
          </div>

          {/* Colonna destra: profilo escort */}
          <div className="md:col-span-2 space-y-4">
            <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 space-y-4">
              <div>
                <label className="block text-xs mb-1 text-gray-300">Biografia (IT)</label>
                <textarea
                  value={bioIt}
                  onChange={(e) => setBioIt(e.target.value)}
                  className="bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2 w-full min-h-[160px] placeholder-gray-400"
                  placeholder="Testo biografico in italiano"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={save} disabled={saving || !userId}>
                  {saving ? "Salvataggio…" : "Salva modifiche"}
                </Button>
              </div>
            </div>

            {user.photos.length > 0 && (
              <div className="rounded-lg border border-gray-600 bg-gray-800 p-4 space-y-4">
                <div className="text-sm font-semibold text-white">Foto della escort</div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {user.photos.map((photo) => (
                    <div key={photo.id} className="border border-gray-700 rounded-md overflow-hidden bg-black/40 flex flex-col">
                      <div className="aspect-[4/5] bg-gray-900 flex items-center justify-center overflow-hidden">
                        <img
                          src={photo.url}
                          alt={`Foto ${photo.id}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2 text-xs text-gray-300 flex items-center justify-between gap-2 border-t border-gray-700">
                        <span className="uppercase tracking-wide text-[10px] text-gray-400">{photo.status}</span>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-6 px-2 text-[11px]"
                          onClick={() => deletePhoto(photo.id)}
                          disabled={deletingPhotoId === photo.id}
                        >
                          {deletingPhotoId === photo.id ? "Eliminazione…" : "Elimina"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
