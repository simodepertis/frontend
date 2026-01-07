"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import SectionHeader from "@/components/SectionHeader";

export default function AdminEditQuickMeetingPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const fromQuery = searchParams?.get('id') || '';
  const fromParams = Array.isArray((params as any)?.id) ? (params as any).id[0] : ((params as any)?.id as string);
  const id = String(fromQuery || fromParams || '');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    title: "",
    description: "",
    category: "DONNA_CERCA_UOMO",
    city: "",
    zone: "",
    phone: "",
    age: "",
    photosText: "",
    isActive: true,
  });

  const photoUrls = (form?.photosText || "")
    .split(/\r?\n/)
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 0);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/quick-meetings/${id}`);
        if (!res.ok) return;
        const data = await res.json();
        const m = data.meeting;
        setForm({
          title: m.title || "",
          description: m.description || "",
          category: m.category || "DONNA_CERCA_UOMO",
          city: m.city || "",
          zone: m.zone || "",
          phone: m.phone || "",
          age: m.age || "",
          photosText: (m.photos || []).join("\n"),
          isActive: !!m.isActive,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const onChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setForm((s: any) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
  };

  const removePhotoUrl = (urlToRemove: string) => {
    const next = (form?.photosText || "")
      .split(/\r?\n/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0 && s !== urlToRemove)
      .join("\n");
    setForm((s: any) => ({ ...s, photosText: next }));
  };

  const onSubmit = async (e: any) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    try {
      const body: any = {
        title: form.title,
        description: form.description,
        category: form.category,
        city: form.city,
        zone: form.zone || null,
        phone: form.phone || null,
        age: form.age ? Number(form.age) : null,
        photos: form.photosText
          .split(/\r?\n/)
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0),
        isActive: !!form.isActive,
      };
      const res = await fetch(`/api/quick-meetings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j?.error) {
        alert(j?.error || "Errore salvataggio annuncio");
        return;
      }
      alert("Annuncio aggiornato");
      router.back();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-gray-400 text-sm">Caricamento incontro veloce…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto p-6">
      <SectionHeader
        title="Modifica Incontro Veloce (Admin)"
        subtitle={id ? `Annuncio #${id}` : "ID mancante"}
      />

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Titolo</label>
          <input
            name="title"
            value={form.title}
            onChange={onChange}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
            placeholder="Titolo annuncio"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Descrizione</label>
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white h-32"
            placeholder="Descrizione dettagliata"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Categoria</label>
            <select
              name="category"
              value={form.category}
              onChange={onChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
            >
              <option value="DONNA_CERCA_UOMO">Donna cerca Uomo</option>
              <option value="TRANS">Trans</option>
              <option value="UOMO_CERCA_UOMO">Uomo cerca Uomo</option>
              <option value="CENTRO_MASSAGGI">Centro Massaggi</option>
              <option value="GIGOLO">Gigolo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Città</label>
            <input
              name="city"
              value={form.city}
              onChange={onChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              placeholder="Città"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Zona</label>
            <input
              name="zone"
              value={form.zone}
              onChange={onChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              placeholder="Zona (opzionale)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Telefono</label>
            <input
              name="phone"
              value={form.phone}
              onChange={onChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              placeholder="Telefono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Età</label>
            <input
              type="number"
              name="age"
              value={form.age}
              onChange={onChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              placeholder="Età"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Foto (una URL per riga)</label>
          <textarea
            name="photosText"
            value={form.photosText}
            onChange={onChange}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white h-32"
            placeholder="https://...jpg\nhttps://...jpg"
          />
        </div>

        {photoUrls.length > 0 && (
          <div className="bg-gray-900 border border-gray-700 rounded p-3">
            <div className="text-sm font-medium text-gray-300 mb-2">Anteprima foto</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {photoUrls.map((url: string, idx: number) => (
                <a
                  key={`${url}-${idx}`}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="relative block rounded overflow-hidden border border-gray-700 bg-gray-800 hover:border-gray-600"
                >
                  <button
                    type="button"
                    className="absolute top-1 right-1 z-10 px-2 py-1 text-[11px] bg-black/70 hover:bg-black/80 text-white rounded"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removePhotoUrl(url);
                    }}
                  >
                    Rimuovi
                  </button>
                  <img
                    src={url}
                    alt={`Foto ${idx + 1}`}
                    className="w-full h-28 object-cover"
                    loading="lazy"
                    onError={(e) => {
                      const img = e.currentTarget;
                      img.style.display = "none";
                      const parent = img.parentElement;
                      if (parent) {
                        parent.setAttribute("data-error", "1");
                      }
                    }}
                  />
                  <div className="px-2 py-1 text-[11px] text-gray-400 truncate">
                    {url}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        <label className="flex items-center gap-2 text-white">
          <input
            type="checkbox"
            name="isActive"
            checked={form.isActive}
            onChange={onChange}
          />
          <span>Annuncio attivo</span>
        </label>

        <div className="flex gap-3 pt-4">
          <button
            disabled={saving}
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded font-medium"
          >
            {saving ? "Salvataggio..." : "Salva modifiche"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded"
          >
            Annulla
          </button>
        </div>
      </form>
    </div>
  );
}
