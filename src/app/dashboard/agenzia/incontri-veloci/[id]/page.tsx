"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditQuickMeetingAgenzia() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [form, setForm] = useState<any>({
    artistName: "",
    title: "",
    description: "",
    category: "DONNA_CERCA_UOMO",
    city: "",
    zone: "",
    phone: "",
    age: "",
    photos: [],
    isActive: true
  });
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('auth-token') || '';
        const res = await fetch(`/api/dashboard/quick-meetings/${id}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        if (res.status === 401) {
          window.location.href = `/autenticazione?redirect=${encodeURIComponent(window.location.pathname)}`;
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        const m = data.meeting;

        const normalizeUploadUrl = (u: string | null | undefined) => {
          const s = String(u || '');
          if (!s) return '';
          if (s.startsWith('/uploads/')) return `/api${s}`;
          return s;
        };

        const existingPhotos = Array.isArray(m.photos) ? m.photos.map((p: any) => normalizeUploadUrl(p)) : [];
        setForm({
          artistName: m.artistName || "",
          title: m.title || "",
          description: m.description || "",
          category: m.category || "DONNA_CERCA_UOMO",
          city: m.city || "",
          zone: m.zone || "",
          phone: m.phone || "",
          age: m.age || "",
          photos: existingPhotos,
          isActive: !!m.isActive
        });

        setPhotoPreviews(existingPhotos);
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

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setPhotoFiles((prev) => [...prev, ...files]);

    const previews = await Promise.all(
      files.map((file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (evt) => resolve((evt.target?.result as string) || '');
          reader.readAsDataURL(file);
        })
      )
    );
    setPhotoPreviews((prev) => [...prev, ...previews.filter(Boolean)]);
    e.currentTarget.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDropFiles = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer?.files || []).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;

    setPhotoFiles((prev) => [...prev, ...files]);
    const previews = await Promise.all(
      files.map((file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (evt) => resolve((evt.target?.result as string) || '');
          reader.readAsDataURL(file);
        })
      )
    );
    setPhotoPreviews((prev) => [...prev, ...previews.filter(Boolean)]);
  };

  const compressFile = (file: File, maxW = 1600, quality = 0.75): Promise<File> => {
    return new Promise((resolve) => {
      try {
        if (!file?.type?.startsWith('image/')) return resolve(file);

        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            try {
              const ratio = img.width > maxW ? maxW / img.width : 1;
              const w = Math.max(1, Math.round(img.width * ratio));
              const h = Math.max(1, Math.round(img.height * ratio));
              const canvas = document.createElement('canvas');
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext('2d');
              if (!ctx) return resolve(file);
              ctx.drawImage(img, 0, 0, w, h);
              canvas.toBlob(
                (blob) => {
                  if (!blob) return resolve(file);
                  const name = (file.name || 'photo').replace(/\.[^/.]+$/, '') + '.jpg';
                  resolve(new File([blob], name, { type: 'image/jpeg' }));
                },
                'image/jpeg',
                quality
              );
            } catch {
              resolve(file);
            }
          };
          img.onerror = () => resolve(file);
          img.src = String(reader.result || '');
        };
        reader.onerror = () => resolve(file);
        reader.readAsDataURL(file);
      } catch {
        resolve(file);
      }
    });
  };

  const removePhoto = (index: number) => {
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));

    // se è una foto già salvata nel DB
    if (index < (form.photos || []).length) {
      setForm((s: any) => ({ ...s, photos: (s.photos || []).filter((_: any, i: number) => i !== index) }));
      return;
    }
    // altrimenti è un file nuovo
    const fileIndex = index - (form.photos || []).length;
    setPhotoFiles((prev) => prev.filter((_, i) => i !== fileIndex));
  };

  const handlePhotoDragStart = (e: React.DragEvent, index: number) => {
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handlePhotoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handlePhotoDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggingIndex === null || draggingIndex === dropIndex) {
      setDraggingIndex(null);
      return;
    }

    setPhotoPreviews((prev) => {
      const next = [...prev];
      const [item] = next.splice(draggingIndex, 1);
      next.splice(dropIndex, 0, item);
      return next;
    });

    const existingLen = (form.photos || []).length;

    // reorder solo tra existing
    if (draggingIndex < existingLen && dropIndex < existingLen) {
      setForm((s: any) => {
        const updated = [...(s.photos || [])];
        const [p] = updated.splice(draggingIndex, 1);
        updated.splice(dropIndex, 0, p);
        return { ...s, photos: updated };
      });
    }

    // reorder solo tra nuovi file
    if (draggingIndex >= existingLen && dropIndex >= existingLen) {
      const from = draggingIndex - existingLen;
      const to = dropIndex - existingLen;
      setPhotoFiles((prev) => {
        const next = [...prev];
        const [f] = next.splice(from, 1);
        next.splice(to, 0, f);
        return next;
      });
    }

    setDraggingIndex(null);
  };

  const setCoverPhoto = (index: number) => {
    if (index === 0) return;

    setPhotoPreviews((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.unshift(item);
      return next;
    });

    const existingLen = (form.photos || []).length;
    if (index < existingLen) {
      setForm((s: any) => {
        const updated = [...(s.photos || [])];
        const [p] = updated.splice(index, 1);
        updated.unshift(p);
        return { ...s, photos: updated };
      });
      return;
    }
    const fileIndex = index - existingLen;
    setPhotoFiles((prev) => {
      if (fileIndex < 0 || fileIndex >= prev.length) return prev;
      const next = [...prev];
      const [f] = next.splice(fileIndex, 1);
      next.unshift(f);
      return next;
    });
  };

  const onSubmit = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Foto: NON inviare base64 nel PATCH. Carica i file e salva solo URL.
      let allPhotos: string[] = Array.isArray(form.photos) ? [...form.photos] : [];

      const token = localStorage.getItem('auth-token') || '';

      if (photoFiles.length > 0) {
        const uploadOne = async (file: File) => {
          const compressed = await compressFile(file);
          const fd = new FormData();
          fd.append('files', compressed);

          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 300000);
          const upRes = await fetch(`/api/dashboard/quick-meetings/${id}/upload`, {
            method: 'POST',
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: fd,
            signal: controller.signal,
          });
          clearTimeout(timeout);

          const upJson = await upRes.json().catch(() => ({}));
          if (!upRes.ok) throw new Error(upJson?.error || `Errore upload (status ${upRes.status})`);
          const url = Array.isArray(upJson?.uploaded) ? upJson.uploaded?.[0]?.url : null;
          if (!url) throw new Error('Upload non riuscito: nessun URL restituito');
          return url as string;
        };

        const CONCURRENCY = 1;
        const results: string[] = [];
        let idx = 0;
        const workers = Array.from({ length: Math.min(CONCURRENCY, photoFiles.length) }, async () => {
          while (idx < photoFiles.length) {
            const current = photoFiles[idx++];
            const url = await uploadOne(current);
            results.push(url);
          }
        });
        await Promise.all(workers);
        allPhotos = allPhotos.concat(results);
      }

      const body: any = {
        artistName: form.artistName || null,
        title: form.title,
        description: form.description,
        category: form.category,
        city: form.city,
        zone: form.zone || null,
        phone: form.phone || null,
        age: form.age ? Number(form.age) : null,
        photos: allPhotos,
        isActive: !!form.isActive
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);
      const res = await fetch(`/api/dashboard/quick-meetings/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        alert('Annuncio aggiornato con successo!');
        router.push("/dashboard/agenzia/incontri-veloci");
      } else {
        const e = await res.json().catch(() => ({}));
        alert(e.error || "Errore salvataggio");
      }
    } catch (error: any) {
      console.error('Errore:', error);
      if (error?.name === 'AbortError') {
        alert('Salvataggio troppo lento: riprova (o carica meno foto alla volta)');
      } else {
        alert('Errore durante il salvataggio');
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
      <h1 className="text-2xl font-bold text-white mb-6">Modifica Incontro Veloce (Agenzia)</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input name="artistName" value={form.artistName} onChange={onChange} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" placeholder="Nome d'arte" />
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

        <div
          className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
            isDragging ? 'border-blue-500 bg-blue-950' : 'border-gray-700'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDropFiles}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-gray-300">Carica foto (puoi trascinare qui)</div>
            <label className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded cursor-pointer">
              Seleziona
              <input type="file" accept="image/*" multiple className="hidden" onChange={onFileChange} />
            </label>
          </div>

          {photoPreviews.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 mt-4">
              {photoPreviews.map((src, idx) => (
                <div
                  key={idx}
                  className="border border-gray-700 rounded-md overflow-hidden bg-gray-900"
                  draggable
                  onDragStart={(e) => handlePhotoDragStart(e, idx)}
                  onDragOver={handlePhotoDragOver}
                  onDrop={(e) => handlePhotoDrop(e, idx)}
                >
                  <div className="relative aspect-[3/2] bg-black flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Foto ${idx + 1}`} className="max-h-full max-w-full object-contain" />
                    <div className="absolute top-2 left-2">
                      <button
                        type="button"
                        onClick={() => setCoverPhoto(idx)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                          idx === 0
                            ? 'bg-yellow-400 border-yellow-300 text-black'
                            : 'bg-gray-900/80 border-yellow-400 text-yellow-300 hover:bg-yellow-400 hover:text-black'
                        }`}
                        title={idx === 0 ? 'Foto vetrina' : 'Imposta come foto vetrina'}
                      >
                        ⭐
                      </button>
                    </div>
                  </div>
                  <div className="p-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded w-full"
                    >
                      Rimuovi
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
