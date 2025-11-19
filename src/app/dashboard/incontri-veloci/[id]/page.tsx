"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditQuickMeeting() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [form, setForm] = useState<any>({
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
  const [hasActivePackage, setHasActivePackage] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('auth-token') || '';
        const res = await fetch(`/api/dashboard/quick-meetings/${id}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (res.status === 401) {
          window.location.href = `/autenticazione?redirect=${encodeURIComponent(window.location.pathname)}`;
          return;
        }
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
          photos: m.photos || [],
          isActive: !!m.isActive
        });
        setPhotoPreviews(m.photos || []);

        // verifica se esiste un pacchetto attivo per questo annuncio
        if (token) {
          try {
            const schedRes = await fetch(`/api/quick-meetings/schedule?meetingId=${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (schedRes.ok) {
              const schedData = await schedRes.json();
              setHasActivePackage(!!schedData?.purchase);
            }
          } catch {
            // in caso di errore, lascia hasActivePackage a false
          }
        }
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
    await handleFilesUpload(files);
  };

  const handleFilesUpload = async (files: File[]) => {
    let allowedFiles = files;
    if (!hasActivePackage) {
      const remaining = Math.max(0, 1 - photoPreviews.length);
      if (remaining <= 0) {
        alert('Per gli annunci senza pacchetto attivo puoi avere solo 1 foto. Acquista un pacchetto per aggiungerne altre.');
        return;
      }
      allowedFiles = files.slice(0, remaining);
    }

    setPhotoFiles(prev => [...prev, ...allowedFiles]);

    // Crea preview
    const newPreviews = await Promise.all(
      allowedFiles.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      })
    );

    setPhotoPreviews(prev => [...prev, ...newPreviews]);
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

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer?.files || []).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) {
      await handleFilesUpload(files);
    }
  };

  const removePhoto = (index: number) => {
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handlePhotoDragStart = (e: React.DragEvent, index: number) => {
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handlePhotoDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handlePhotoDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggingIndex === null || draggingIndex === dropIndex) {
      setDraggingIndex(null);
      return;
    }

    const newPreviews = [...photoPreviews];
    const [draggedItem] = newPreviews.splice(draggingIndex, 1);
    newPreviews.splice(dropIndex, 0, draggedItem);
    setPhotoPreviews(newPreviews);

    const newFiles = [...photoFiles];
    if (draggingIndex < form.photos.length && dropIndex < form.photos.length) {
      // Entrambi sono foto esistenti
      const updatedPhotos = [...form.photos];
      const [draggedPhoto] = updatedPhotos.splice(draggingIndex, 1);
      updatedPhotos.splice(dropIndex, 0, draggedPhoto);
      setForm((s: any) => ({ ...s, photos: updatedPhotos }));
    } else if (draggingIndex >= form.photos.length && dropIndex >= form.photos.length) {
      // Entrambi sono nuovi file
      const dragFileIndex = draggingIndex - form.photos.length;
      const dropFileIndex = dropIndex - form.photos.length;
      const [draggedFile] = newFiles.splice(dragFileIndex, 1);
      newFiles.splice(dropFileIndex, 0, draggedFile);
      setPhotoFiles(newFiles);
    }

    setDraggingIndex(null);
  };

  const setCoverPhoto = (index: number) => {
    if (index === 0) return;

    // Aggiorna le preview (sposta l'indice scelto in prima posizione)
    setPhotoPreviews((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.unshift(item);
      return next;
    });

    // Se è una foto già salvata nel DB (parte iniziale di form.photos)
    if (index < form.photos.length) {
      setForm((s: any) => {
        const updated = [...s.photos];
        const [p] = updated.splice(index, 1);
        updated.unshift(p);
        return { ...s, photos: updated };
      });
    } else {
      // È una nuova foto caricata (in photoFiles)
      const fileIndex = index - form.photos.length;
      setPhotoFiles((prev) => {
        if (fileIndex < 0 || fileIndex >= prev.length) return prev;
        const next = [...prev];
        const [f] = next.splice(fileIndex, 1);
        next.unshift(f);
        return next;
      });
    }
  };

  const onSubmit = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Se ci sono nuove foto, caricale
      let allPhotos = [...form.photos];
      
      if (photoFiles.length > 0) {
        for (const file of photoFiles) {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve) => {
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });
          allPhotos.push(base64);
        }
      }

      const body: any = {
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
      
      const token = localStorage.getItem('auth-token') || '';
      const res = await fetch(`/api/dashboard/quick-meetings/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        alert('Annuncio aggiornato con successo!');
        router.push("/dashboard/incontri-veloci");
      } else {
        const e = await res.json().catch(() => ({}));
        alert(e.error || "Errore salvataggio");
      }
    } catch (error) {
      console.error('Errore:', error);
      alert('Errore durante il salvataggio');
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
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Titolo</label>
          <input name="title" value={form.title} onChange={onChange} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" placeholder="Titolo annuncio" required />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Descrizione</label>
          <textarea name="description" value={form.description} onChange={onChange} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white h-32" placeholder="Descrizione dettagliata" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Categoria</label>
            <select name="category" value={form.category} onChange={onChange} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
              <option value="DONNA_CERCA_UOMO">👩‍❤️‍👨 Donna cerca Uomo</option>
              <option value="TRANS">🏳️‍⚧️ Trans</option>
              <option value="UOMO_CERCA_UOMO">👨‍❤️‍👨 Uomo cerca Uomo</option>
              <option value="CENTRO_MASSAGGI">💆‍♀️ Centro Massaggi</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Città</label>
            <input name="city" value={form.city} onChange={onChange} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" placeholder="Città" required />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Zona</label>
            <input name="zone" value={form.zone} onChange={onChange} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" placeholder="Zona (opzionale)" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Telefono</label>
            <input name="phone" value={form.phone} onChange={onChange} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" placeholder="Telefono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Età</label>
            <input type="number" name="age" value={form.age} onChange={onChange} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" placeholder="Età" />
          </div>
        </div>

        {/* Gestione Foto */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Foto</label>
          {!hasActivePackage && (
            <p className="text-xs text-yellow-300 mb-2">
              Per gli annunci senza pacchetto attivo puoi caricare solo 1 foto. Acquista un pacchetto Incontri Veloci per aggiungerne altre.
            </p>
          )}
          <div 
            className={`mb-4 border-2 border-dashed rounded-lg p-6 transition-colors ${
              isDragging 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-gray-600 hover:border-blue-500'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="text-center">
              <div className="text-4xl mb-2">{isDragging ? '📸' : '📷'}</div>
              <div className="text-white mb-2">
                {isDragging ? 'Rilascia qui le foto' : '👆 Trascina le foto qui o clicca per caricare'}
              </div>
              <label className="cursor-pointer inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">
                Seleziona Foto
                <input type="file" multiple accept="image/*" onChange={onFileChange} className="hidden" />
              </label>
              <div className="text-sm text-gray-400 mt-2">PNG, JPG fino a 10MB</div>
            </div>
          </div>
          
          {photoPreviews.length > 0 && (
            <div>
              <div className="text-xs text-gray-400 mb-2">
                ⭐ La prima foto è l'anteprima principale - Trascina per riordinare
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {photoPreviews.map((preview, i) => (
                  <div 
                    key={i} 
                    draggable
                    onDragStart={(e) => handlePhotoDragStart(e, i)}
                    onDragOver={(e) => handlePhotoDragOver(e, i)}
                    onDrop={(e) => handlePhotoDrop(e, i)}
                    className={`relative group cursor-move ${draggingIndex === i ? 'opacity-50' : ''}`}
                  >
                    <div className="absolute -top-2 -left-2 z-10">
                      <button
                        type="button"
                        onClick={() => setCoverPhoto(i)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                          i === 0
                            ? 'bg-yellow-400 border-yellow-300 text-black'
                            : 'bg-gray-900/80 border-yellow-400 text-yellow-300 hover:bg-yellow-400 hover:text-black'
                        }`}
                        title={i === 0 ? 'Copertina' : 'Imposta come copertina'}
                      >
                        ⭐
                      </button>
                    </div>
                    <img
                      src={preview}
                      alt={`Foto ${i + 1}`}
                      className={`w-full h-32 object-cover rounded border-2 transition-colors ${
                        i === 0 ? 'border-yellow-400' : 'border-gray-700 hover:border-blue-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                    <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                      {i + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <label className="flex items-center gap-2 text-white">
          <input type="checkbox" name="isActive" checked={form.isActive} onChange={onChange} className="w-4 h-4" />
          <span>Annuncio attivo</span>
        </label>
        
        <div className="flex gap-3 pt-4">
          <button disabled={saving} type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded font-medium">
            {saving ? 'Salvataggio...' : '✔️ Salva Modifiche'}
          </button>
          <button type="button" onClick={() => router.back()} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded">Annulla</button>
        </div>
      </form>
    </div>
  );
}
