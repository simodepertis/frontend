"use client";

import { useState } from "react";

export default function ImportBakecaPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [form, setForm] = useState({
    city: 'Milano',
    category: 'DONNA_CERCA_UOMO',
    limit: '10'
  });

  const startImport = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const token = localStorage.getItem('auth-token') || '';
      const res = await fetch('/api/admin/import-bakeca', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          city: form.city,
          category: form.category,
          limit: parseInt(form.limit)
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        setResult(data);
      } else {
        setResult({ error: data.error || 'Errore durante l\'importazione' });
      }
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-white mb-2">🤖 Import Bakecaincontri</h1>
      <p className="text-gray-400 mb-6">
        Importa annunci da bakecaincontrii.com nella sezione Incontri Veloci
      </p>

      {/* Avviso Vercel */}
      <div className="mb-6 p-4 bg-yellow-900/30 border border-yellow-600 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <div className="text-yellow-400 font-semibold mb-1">Limitazioni Vercel</div>
            <div className="text-sm text-yellow-200">
              • Timeout massimo: 10 secondi (hobby) o 60 secondi (pro)<br/>
              • Limite annunci: max 10 per volta<br/>
              • Richiede attivazione manuale (non automatico)<br/>
              • Per import automatici, considera Render o servizi esterni
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Città
            </label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white"
              placeholder="Milano"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Categoria
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white"
            >
              <option value="DONNA_CERCA_UOMO">👩‍❤️‍👨 Donna cerca Uomo</option>
              <option value="TRANS">🏳️‍⚧️ Trans</option>
              <option value="UOMO_CERCA_UOMO">👨‍❤️‍👨 Uomo cerca Uomo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Limite annunci (max 10 su Vercel)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={form.limit}
              onChange={(e) => setForm({ ...form, limit: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white"
            />
          </div>

          <button
            onClick={startImport}
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-medium"
          >
            {loading ? '⏳ Importazione in corso...' : '🚀 Avvia Importazione'}
          </button>
        </div>
      </div>

      {/* Risultati */}
      {result && (
        <div className={`p-4 rounded-lg border ${
          result.error 
            ? 'bg-red-900/30 border-red-600' 
            : 'bg-green-900/30 border-green-600'
        }`}>
          {result.error ? (
            <>
              <div className="text-red-400 font-semibold mb-2">❌ Errore</div>
              <div className="text-red-200 text-sm">{result.error}</div>
              {result.details && (
                <div className="text-red-300 text-xs mt-2">{result.details}</div>
              )}
            </>
          ) : (
            <>
              <div className="text-green-400 font-semibold mb-3">✅ Importazione completata</div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Importati</div>
                  <div className="text-2xl font-bold text-green-400">{result.imported || 0}</div>
                </div>
                <div>
                  <div className="text-gray-400">Saltati</div>
                  <div className="text-2xl font-bold text-yellow-400">{result.skipped || 0}</div>
                </div>
                <div>
                  <div className="text-gray-400">Totale trovati</div>
                  <div className="text-2xl font-bold text-blue-400">{result.total || 0}</div>
                </div>
              </div>
              {result.errors && result.errors.length > 0 && (
                <div className="mt-4 text-xs text-yellow-200">
                  <div className="font-semibold mb-1">Errori ({result.errors.length}):</div>
                  <div className="max-h-40 overflow-y-auto">
                    {result.errors.map((err: any, i: number) => (
                      <div key={i} className="mb-1">• {err.error}</div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-900/30 border border-blue-600 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div className="text-sm text-blue-200">
            <div className="font-semibold text-blue-400 mb-1">Come funziona</div>
            1. Seleziona città e categoria<br/>
            2. Scegli quanti annunci importare (max 10)<br/>
            3. Clicca "Avvia Importazione"<br/>
            4. Gli annunci verranno salvati in "Incontri Veloci"<br/>
            5. I duplicati vengono automaticamente saltati<br/>
            <div className="mt-2 text-xs text-blue-300">
              ⚡ Ogni import dura circa 20-40 secondi
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
