"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const COMMON: { code: string; label: string }[] = [
  { code: "IT", label: "Italia" },
  { code: "FR", label: "Francia" },
  { code: "DE", label: "Germania" },
  { code: "ES", label: "Spagna" },
  { code: "UK", label: "Regno Unito" },
  { code: "CH", label: "Svizzera" },
  { code: "NL", label: "Olanda" },
  { code: "BE", label: "Belgio" },
];

export default function CountrySelector({ value, onChange }: { value: string[]; onChange: (arr: string[]) => void }) {
  const [custom, setCustom] = useState("");

  const set = new Set((value || []).map((x) => x.toUpperCase()));
  function toggle(code: string) {
    const up = code.toUpperCase();
    const next = new Set(set);
    if (next.has(up)) next.delete(up);
    else next.add(up);
    onChange(Array.from(next));
  }
  function addCustom() {
    const code = custom.trim().toUpperCase();
    if (!code) return;
    if (/^[A-Z]{2}$/.test(code)) {
      toggle(code);
      setCustom("");
    } else {
      alert("Inserisci un codice paese ISO a 2 lettere, es. FR");
    }
  }
  function remove(code: string) {
    const up = code.toUpperCase();
    const next = (value || []).filter((x) => x.toUpperCase() !== up);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {COMMON.map((c) => (
          <button
            key={c.code}
            type="button"
            onClick={() => toggle(c.code)}
            className={`px-3 py-1 rounded-full border text-sm ${set.has(c.code) ? "bg-blue-600 border-blue-500 text-white" : "bg-gray-800 border-gray-600 text-gray-200 hover:border-blue-500"}`}
            title={c.label}
          >
            {c.code}
          </button>
        ))}
      </div>

      {/* selezionati */}
      <div className="flex flex-wrap gap-2">
        {(value || []).map((c) => (
          <span key={c} className="inline-flex items-center gap-2 bg-gray-700 text-white text-xs rounded-full px-2 py-1">
            {c.toUpperCase()}
            <button type="button" onClick={() => remove(c)} className="text-white/80 hover:text-white">×</button>
          </span>
        ))}
      </div>

      {/* aggiungi custom */}
      <div className="flex items-center gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Codice paese ISO (es. FR)"
          className="bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 w-40"
        />
        <Button variant="secondary" type="button" onClick={addCustom}>Aggiungi</Button>
      </div>
    </div>
  );
}
