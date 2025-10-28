"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditQuickMeeting() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
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
    isActive: true
  });

  useEffect(() => {
    const load = async () => {
      try {
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
          isActive: !!m.isActive
        });
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const onChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setForm((s: any) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
  };

  const onSubmit = async (e: any) => {
    e.preventDefault();
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
        isActive: !!form.isActive
      };
      const res = await fetch(`/api/quick-meetings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        router.push("/dashboard/incontri-veloci");
      } else {
        const e = await res.json().catch(() => ({}));
        alert(e.error || "Errore salvataggio");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-gray-400">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Modifica Incontro Veloce</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input name="title" value={form.title} onChange={onChange} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" placeholder="Titolo" />
        <textarea name="description" value={form.description} onChange={onChange} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white h-32" placeholder="Descrizione" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select name="category" value={form.category} onChange={onChange} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
            <option value="DONNA_CERCA_UOMO">Donna cerca Uomo</option>
            <option value="TRANS">Trans</option>
            <option value="UOMO_CERCA_UOMO">Uomo cerca Uomo</option>
            <option value="CENTRO_MASSAGGI">Centro Massaggi</option>
          </select>
          <input name="city" value={form.city} onChange={onChange} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" placeholder="Città" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input name="zone" value={form.zone} onChange={onChange} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" placeholder="Zona" />
          <input name="phone" value={form.phone} onChange={onChange} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" placeholder="Telefono" />
          <input type="number" name="age" value={form.age} onChange={onChange} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" placeholder="Età" />
        </div>
        <textarea name="photosText" value={form.photosText} onChange={onChange} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white h-32" placeholder="Foto: una URL per riga" />
        <label className="flex items-center gap-2 text-white">
          <input type="checkbox" name="isActive" checked={form.isActive} onChange={onChange} />
          Attivo
        </label>
        <div className="flex gap-3">
          <button disabled={saving} type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded">Salva</button>
          <button type="button" onClick={() => router.back()} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded">Annulla</button>
        </div>
      </form>
    </div>
  );
}
