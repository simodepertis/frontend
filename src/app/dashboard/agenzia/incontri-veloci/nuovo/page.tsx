"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FormData {
  // Step 1: Il tuo annuncio
  category: string;
  city: string;
  address: string;
  postalCode: string;
  zone: string;
  
  // Step 1: I tuoi dati
  age: string;
  artistName: string;
  title: string;
  description: string;
  
  // Step 1: I tuoi contatti
  contactPreference: 'phone' | 'email_phone' | 'email';
  email: string;
  phone: string;
  whatsapp: boolean;
  
  // Step 2: Foto
  photos: string[];
}

const CATEGORIES = [
  { value: 'DONNA_CERCA_UOMO', label: 'Donna cerca Uomo' },
  { value: 'TRANS', label: 'Trans' },
  { value: 'UOMO_CERCA_UOMO', label: 'Uomo cerca Uomo' },
  { value: 'CENTRO_MASSAGGI', label: 'Centro Massaggi' }
];

const CITIES = [
  'Milano', 'Roma', 'Torino', 'Bologna', 'Firenze', 'Napoli', 
  'Venezia', 'Verona', 'Genova', 'Palermo'
];

export default function NuovoIncontroVeloceAgenzia() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    category: '',
    city: '',
    address: '',
    postalCode: '',
    zone: '',
    age: '',
    artistName: '',
    title: '',
    description: '',
    contactPreference: 'phone',
    email: '',
    phone: '',
    whatsapp: false,
    photos: []
  });

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!formData.category) {
      alert('Seleziona una categoria');
      return false;
    }
    if (!formData.city) {
      alert('Seleziona una città');
      return false;
    }
    if (!formData.artistName || formData.artistName.length < 2) {
      alert('Inserisci il nome d\'arte (min 2 caratteri)');
      return false;
    }
    if (!formData.title || formData.title.length < 5) {
      alert('Inserisci un titolo (min 5 caratteri)');
      return false;
    }
    if (!formData.description || formData.description.length < 20) {
      alert('Inserisci una descrizione (min 20 caratteri)');
      return false;
    }
    if (!formData.phone || formData.phone.length < 9) {
      alert('Inserisci un numero di telefono valido');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          updateField('photos', [...formData.photos, event.target.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    updateField('photos', formData.photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (formData.photos.length === 0) {
      if (!confirm('Non hai caricato foto. Vuoi continuare comunque?')) {
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetch('/api/dashboard/quick-meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          city: formData.city.toUpperCase(),
          zone: formData.zone || null,
          phone: formData.phone,
          whatsapp: formData.whatsapp ? `https://wa.me/${formData.phone.replace(/\D/g, '')}` : null,
          age: formData.age ? parseInt(formData.age) : null,
          photos: formData.photos,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 giorni
        })
      });

      if (res.ok) {
        alert('✅ Annuncio creato con successo!');
        router.push('/dashboard/agenzia/incontri-veloci');
      } else {
        const error = await res.json();
        alert(`Errore: ${error.error || 'Impossibile creare l\'annuncio'}`);
      }
    } catch (error) {
      console.error('Errore:', error);
      alert('Errore durante la creazione dell\'annuncio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
            step >= 1 ? 'bg-pink-600 text-white' : 'bg-gray-700 text-gray-400'
          }`}>
            1
          </div>
          <div className={`w-24 h-1 ${step >= 2 ? 'bg-pink-600' : 'bg-gray-700'}`}></div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
            step >= 2 ? 'bg-pink-600 text-white' : 'bg-gray-700 text-gray-400'
          }`}>
            2
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-1">
            {step === 1 ? 'Dati Annuncio' : 'Carica Foto'}
          </h1>
          <p className="text-gray-400 text-sm">Step {step} di 2</p>
        </div>
      </div>

      {/* Step 1: Dati */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Il tuo annuncio */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Il tuo annuncio</h2>
            
            <div className="space-y-4">
              {/* Categoria */}
              <div>
                <label className="block text-white font-medium mb-2">
                  * Seleziona categoria
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-pink-500 focus:outline-none"
                >
                  <option value="">Seleziona categoria</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Città */}
              <div>
                <label className="block text-white font-medium mb-2">
                  * Seleziona la città
                </label>
                <select
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-pink-500 focus:outline-none"
                >
                  <option value="">Seleziona città</option>
                  {CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Indirizzo e CAP */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">Indirizzo</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-pink-500 focus:outline-none"
                    placeholder="Es: Via Roma"
                  />
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">Codice postale</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => updateField('postalCode', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-pink-500 focus:outline-none"
                    placeholder="20100"
                  />
                </div>
              </div>

              {/* Zona/Quartiere */}
              <div>
                <label className="block text-white font-medium mb-2">Area/Zona/Quartiere</label>
                <input
                  type="text"
                  value={formData.zone}
                  onChange={(e) => updateField('zone', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-pink-500 focus:outline-none"
                  placeholder="Es: Centro, Porta Romana, ecc."
                />
              </div>
            </div>
          </div>

          {/* I tuoi dati */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-bold text-white mb-4">I tuoi dati</h2>
            
            <div className="space-y-4">
              {/* Età */}
              <div>
                <label className="block text-white font-medium mb-2">
                  <span className="mr-1">📅</span> Età
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => updateField('age', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-pink-500 focus:outline-none"
                  placeholder="Es: 25"
                  min="18"
                  max="99"
                />
              </div>

              {/* Nome d'arte */}
              <div>
                <label className="block text-white font-medium mb-2">
                  * Nome d'arte <span className="text-xs text-gray-400">(max 20 caratteri)</span>
                </label>
                <input
                  type="text"
                  value={formData.artistName}
                  onChange={(e) => updateField('artistName', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-pink-500 focus:outline-none"
                  placeholder="Inserisci il nome d'arte"
                  maxLength={20}
                />
                <div className="text-right text-xs text-gray-400 mt-1">
                  {formData.artistName.length}/20
                </div>
              </div>

              {/* Titolo */}
              <div>
                <label className="block text-white font-medium mb-2">
                  * Titolo <span className="text-xs text-gray-400">(5 caratteri necessari)</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-pink-500 focus:outline-none"
                  placeholder="Dai un buon titolo al tuo annuncio"
                />
              </div>

              {/* Descrizione */}
              <div>
                <label className="block text-white font-medium mb-2">
                  * Testo <span className="text-xs text-gray-400">(20 caratteri necessari)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-pink-500 focus:outline-none"
                  placeholder="Usa questo spazio per descrivere te stesso, il tuo corpo, per parlare delle tue specialità, cosa ti piace..."
                  rows={5}
                />
                <div className="text-right text-xs text-gray-400 mt-1">
                  {formData.description.length} caratteri
                </div>
              </div>
            </div>
          </div>

          {/* I tuoi contatti */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-bold text-white mb-4">I tuoi contatti</h2>
            
            <div className="space-y-4">
              {/* Preferenza contatto */}
              <div>
                <label className="block text-white font-medium mb-3">
                  Come preferisci essere contattato?
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => updateField('contactPreference', 'phone')}
                    className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                      formData.contactPreference === 'phone'
                        ? 'border-pink-500 bg-pink-500/20 text-white'
                        : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    Solo telefono
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('contactPreference', 'email_phone')}
                    className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                      formData.contactPreference === 'email_phone'
                        ? 'border-pink-500 bg-pink-500/20 text-white'
                        : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    Email e telefono
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('contactPreference', 'email')}
                    className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                      formData.contactPreference === 'email'
                        ? 'border-pink-500 bg-pink-500/20 text-white'
                        : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    Solo email
                  </button>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-white font-medium mb-2">
                  * 📧 Indirizzo email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-pink-500 focus:outline-none"
                  placeholder="email@example.com"
                />
                <div className="text-xs text-gray-400 mt-1">Non visibile online</div>
              </div>

              {/* Telefono */}
              <div>
                <label className="block text-white font-medium mb-2">
                  * 📞 Numero di telefono
                </label>
                <div className="flex gap-2">
                  <div className="w-20 px-4 py-3 bg-gray-700 rounded-lg border border-gray-600 flex items-center justify-center text-white">
                    🇮🇹 +39
                  </div>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-pink-500 focus:outline-none"
                    placeholder="312 345 6789"
                  />
                </div>
              </div>

              {/* WhatsApp */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="whatsapp"
                  checked={formData.whatsapp}
                  onChange={(e) => updateField('whatsapp', e.target.checked)}
                  className="w-5 h-5"
                />
                <label htmlFor="whatsapp" className="text-white flex items-center gap-2">
                  <span className="text-2xl">💬</span>
                  WhatsApp
                </label>
              </div>
            </div>
          </div>

          {/* Bottoni */}
          <div className="flex justify-between pt-4">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              ← Annulla
            </button>
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-lg transition-colors"
            >
              PROSEGUI →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Foto */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-bold text-white mb-4">📸 Carica le foto</h2>
            
            {/* Upload */}
            <div className="mb-6">
              <label className="block w-full px-6 py-8 border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:border-pink-500 transition-colors">
                <div className="text-4xl mb-2">📷</div>
                <div className="text-white mb-1">Clicca per caricare foto</div>
                <div className="text-sm text-gray-400">PNG, JPG fino a 10MB</div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Galleria */}
            {formData.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {formData.photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Foto ${index + 1}`}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {formData.photos.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                Nessuna foto caricata
              </div>
            )}
          </div>

          {/* Bottoni */}
          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              ← Indietro
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-3 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvataggio...' : '✓ Pubblica Annuncio'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
