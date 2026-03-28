"use client";

import { useEffect, useState } from "react";
import { CITIES_ORDER } from "@/lib/cities";

interface Faq { question: string; answer: string }
interface CityContent {
  id?: number;
  city: string;
  title?: string;
  introText?: string;
  faqs: Faq[];
}

const ALL_CITIES = ["ALL", ...CITIES_ORDER];

export default function AdminSeoCityPage() {
  const [selectedCity, setSelectedCity] = useState("ALL");
  const [content, setContent] = useState<CityContent>({ city: "ALL", title: "", introText: "", faqs: [] });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") || "" : "";

  useEffect(() => {
    loadContent(selectedCity);
  }, [selectedCity]);

  async function loadContent(city: string) {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/city-page-content?city=${encodeURIComponent(city)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.item) {
        setContent({
          city,
          title: data.item.title || "",
          introText: data.item.introText || "",
          faqs: Array.isArray(data.item.faqs) ? data.item.faqs : [],
        });
      } else {
        setContent({ city, title: "", introText: "", faqs: [] });
      }
    } catch {
      setContent({ city, title: "", introText: "", faqs: [] });
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/city-page-content", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...content, city: selectedCity }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ type: "ok", text: "Salvato con successo!" });
      } else {
        setMsg({ type: "err", text: data.error || "Errore nel salvataggio" });
      }
    } catch {
      setMsg({ type: "err", text: "Errore di rete" });
    } finally {
      setSaving(false);
    }
  }

  async function deleteContent() {
    if (!confirm("Eliminare il contenuto per questa città?")) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/city-page-content?city=${encodeURIComponent(selectedCity)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setContent({ city: selectedCity, title: "", introText: "", faqs: [] });
      setMsg({ type: "ok", text: "Contenuto eliminato." });
    } catch {
      setMsg({ type: "err", text: "Errore eliminazione" });
    } finally {
      setSaving(false);
    }
  }

  function updateFaq(index: number, field: "question" | "answer", value: string) {
    setContent((prev) => {
      const faqs = [...prev.faqs];
      faqs[index] = { ...faqs[index], [field]: value };
      return { ...prev, faqs };
    });
  }

  function addFaq() {
    setContent((prev) => ({ ...prev, faqs: [...prev.faqs, { question: "", answer: "" }] }));
  }

  function removeFaq(index: number) {
    setContent((prev) => ({ ...prev, faqs: prev.faqs.filter((_, i) => i !== index) }));
  }

  function moveFaq(index: number, dir: -1 | 1) {
    setContent((prev) => {
      const faqs = [...prev.faqs];
      const to = index + dir;
      if (to < 0 || to >= faqs.length) return prev;
      [faqs[index], faqs[to]] = [faqs[to], faqs[index]];
      return { ...prev, faqs };
    });
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">SEO Incontri Veloci per Città</h1>
        <p className="text-sm text-gray-400 mt-1">
          Aggiungi testo introduttivo e FAQ che appaiono in fondo alla pagina pubblica quando l'utente filtra per città.
        </p>
      </div>

      {/* Selettore città */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Città</label>
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
        >
          {ALL_CITIES.map((c) => (
            <option key={c} value={c}>
              {c === "ALL" ? "Tutte le città (pagina generale)" : c}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Caricamento...</div>
      ) : (
        <>
          {/* Titolo sezione */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Titolo sezione (opzionale)</label>
            <input
              type="text"
              value={content.title || ""}
              onChange={(e) => setContent((p) => ({ ...p, title: e.target.value }))}
              placeholder={`es. Incontri a ${selectedCity === "ALL" ? "Italia" : selectedCity}`}
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Testo introduttivo */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Testo introduttivo</label>
            <textarea
              value={content.introText || ""}
              onChange={(e) => setContent((p) => ({ ...p, introText: e.target.value }))}
              rows={6}
              placeholder="Descrizione della città, tono evocativo, SEO..."
              className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm resize-y"
            />
          </div>

          {/* FAQ */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">Domande e risposte (FAQ)</label>
              <button
                type="button"
                onClick={addFaq}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
              >
                + Aggiungi FAQ
              </button>
            </div>

            {content.faqs.length === 0 && (
              <div className="text-sm text-gray-500 italic">Nessuna FAQ aggiunta. Clicca &quot;Aggiungi FAQ&quot; per iniziare.</div>
            )}

            <div className="space-y-4">
              {content.faqs.map((faq, i) => (
                <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">FAQ #{i + 1}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => moveFaq(i, -1)}
                        disabled={i === 0}
                        className="text-xs text-gray-400 hover:text-white disabled:opacity-30"
                      >↑</button>
                      <button
                        type="button"
                        onClick={() => moveFaq(i, 1)}
                        disabled={i === content.faqs.length - 1}
                        className="text-xs text-gray-400 hover:text-white disabled:opacity-30"
                      >↓</button>
                      <button
                        type="button"
                        onClick={() => removeFaq(i)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >Rimuovi</button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => updateFaq(i, "question", e.target.value)}
                    placeholder="Domanda"
                    className="w-full bg-gray-900 border border-gray-600 text-white rounded px-3 py-2 text-sm"
                  />
                  <textarea
                    value={faq.answer}
                    onChange={(e) => updateFaq(i, "answer", e.target.value)}
                    placeholder="Risposta"
                    rows={3}
                    className="w-full bg-gray-900 border border-gray-600 text-white rounded px-3 py-2 text-sm resize-y"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Azioni */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-6 py-2 rounded-lg"
            >
              {saving ? "Salvataggio..." : "Salva"}
            </button>
            <button
              type="button"
              onClick={deleteContent}
              disabled={saving}
              className="bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg"
            >
              Elimina
            </button>
          </div>

          {msg && (
            <div className={`text-sm px-4 py-2 rounded ${msg.type === "ok" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>
              {msg.text}
            </div>
          )}
        </>
      )}
    </div>
  );
}
