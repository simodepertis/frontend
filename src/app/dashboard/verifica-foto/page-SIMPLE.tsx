"use client";

import SectionHeader from "@/components/SectionHeader";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function VerificaFotoPage() {
  // SEMPLICE: array di URL base64
  const [photos, setPhotos] = useState<string[]>([]);
  const [faceIndex, setFaceIndex] = useState<number>(-1); // Indice foto con volto
  const [submitting, setSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Upload foto - IDENTICO a incontri-veloci
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotos(prev => [...prev, event.target.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFilesUpload = (files: FileList) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotos(prev => [...prev, event.target.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFilesUpload(files);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    if (faceIndex === index) setFaceIndex(-1);
    if (faceIndex > index) setFaceIndex(faceIndex - 1);
  };

  const handleSubmit = async () => {
    if (photos.length < 3) {
      alert('Seleziona almeno 3 foto');
      return;
    }

    if (faceIndex === -1) {
      alert('Segna almeno 1 foto come volto');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('auth-token') || '';
      
      // Invia TUTTE le foto in un colpo solo
      const res = await fetch('/api/escort/photos/submit-simple', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          photos: photos.map((url, idx) => ({
            url,
            name: `foto-${idx + 1}.jpg`,
            size: 0,
            isFace: idx === faceIndex
          }))
        })
      });

      if (res.ok) {
        alert('✅ Foto inviate in revisione con successo!');
        setPhotos([]);
        setFaceIndex(-1);
      } else {
        const error = await res.json();
        alert(`Errore: ${error.error || 'Impossibile inviare le foto'}`);
      }
    } catch (error) {
      console.error('Errore:', error);
      alert('Errore durante l\'invio delle foto');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Verifica Foto" subtitle="Carica almeno 3 foto, segna 1 con volto" />

      {/* Area upload */}
      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? 'border-blue-500 bg-blue-950' : 'border-gray-600'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <p className="mb-4">Trascina foto qui o clicca per selezionare</p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
            id="photo-upload"
          />
          <label htmlFor="photo-upload">
            <Button as="span" variant="secondary">Seleziona foto</Button>
          </label>
        </div>
      </div>

      {/* Lista foto */}
      {photos.length > 0 && (
        <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
          <div className="font-semibold mb-3">
            Foto caricate: {photos.length} {faceIndex >= 0 ? '✓ Con volto' : '⚠️ Nessun volto'}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo, idx) => (
              <div key={idx} className="border border-gray-600 rounded-md overflow-hidden">
                <div className="relative w-full h-56 bg-black">
                  <Image src={photo} alt={`Foto ${idx + 1}`} fill className="object-contain" />
                  {faceIndex === idx && (
                    <div className="absolute top-2 left-2 text-xs font-bold bg-blue-600 text-white px-2 py-1 rounded">
                      Volto
                    </div>
                  )}
                </div>
                <div className="p-2 flex gap-2">
                  <Button 
                    variant="secondary" 
                    className="px-2 py-1 h-7 text-xs flex-1"
                    onClick={() => removePhoto(idx)}
                  >
                    Rimuovi
                  </Button>
                  <Button 
                    variant="secondary"
                    className={`px-2 py-1 h-7 text-xs flex-1 ${faceIndex === idx ? 'bg-blue-600 text-white' : ''}`}
                    onClick={() => setFaceIndex(faceIndex === idx ? -1 : idx)}
                  >
                    {faceIndex === idx ? 'Rimuovi volto' : 'Segna volto'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={submitting || photos.length < 3 || faceIndex === -1}
        >
          {submitting ? 'Invio in corso...' : 'Invia a revisione'}
        </Button>
      </div>
    </div>
  );
}
