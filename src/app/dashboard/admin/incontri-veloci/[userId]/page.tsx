"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SectionHeader from "@/components/SectionHeader";

interface QuickMeetingItem {
  id: number;
  title: string;
  city: string;
  category: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminUserQuickMeetingsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = Number(params?.userId || 0);

  const [items, setItems] = useState<QuickMeetingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") || "" : "";
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`/api/admin/quick-meetings?userId=${userId}`, { headers });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(j?.error || "Errore caricamento incontri veloci");
          setItems([]);
          return;
        }
        const list: QuickMeetingItem[] = (j.meetings || []).map((m: any) => ({
          id: m.id,
          title: m.title,
          city: m.city,
          category: m.category,
          isActive: !!m.isActive,
          createdAt: m.createdAt,
        }));
        setItems(list);
      } catch (e) {
        console.error(e);
        setError("Errore imprevisto");
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  async function deleteMeeting(id: number) {
    if (!window.confirm("Sei sicuro di voler eliminare questo annuncio di incontro veloce?")) return;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") || "" : "";
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/admin/quick-meetings?id=${id}`, {
        method: "DELETE",
        headers,
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.error) {
        alert(j?.error || "Errore eliminazione annuncio");
        return;
      }
      setItems((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      console.error(e);
      alert("Errore imprevisto durante l'eliminazione");
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Incontri Veloci dell'utente"
        subtitle={userId ? `User #${userId}` : "userId mancante"}
      />

      {loading ? (
        <div className="text-gray-400 text-sm">Caricamento incontri veloci…</div>
      ) : error ? (
        <div className="text-red-400 text-sm">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-gray-400 text-sm">Nessun incontro veloce collegato a questo utente.</div>
      ) : (
        <div className="rounded-lg border border-gray-700 bg-gray-900 overflow-hidden">
          <table className="w-full text-sm text-gray-200">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Titolo</th>
                <th className="px-4 py-3 text-left">Città</th>
                <th className="px-4 py-3 text-left">Categoria</th>
                <th className="px-4 py-3 text-left">Attivo</th>
                <th className="px-4 py-3 text-left">Creato il</th>
                <th className="px-4 py-3 text-left">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id} className="border-t border-gray-700">
                  <td className="px-4 py-3 text-xs text-gray-400">{m.id}</td>
                  <td className="px-4 py-3 text-white">{m.title}</td>
                  <td className="px-4 py-3 text-gray-200">{m.city}</td>
                  <td className="px-4 py-3 text-gray-200">{m.category}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                      m.isActive ? "bg-emerald-700 text-emerald-100" : "bg-gray-700 text-gray-300"
                    }`}>
                      {m.isActive ? "Attivo" : "Disattivato"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{String(m.createdAt).split("T")[0]}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/admin/incontri-veloci/dettaglio/${m.id}`)}
                      className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-xs text-white"
                    >
                      Modifica
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMeeting(m.id)}
                      className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-xs text-white"
                    >
                      Elimina
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
