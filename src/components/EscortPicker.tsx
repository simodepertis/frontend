"use client";

import { useEffect, useState } from "react";

type EscortRow = { id: number; userId: number; user?: { nome?: string; email?: string } };

export default function EscortPicker({ value, onChange, className = "" }: { value?: number; onChange: (userId: number)=>void; className?: string }) {
  const [items, setItems] = useState<EscortRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/agency/escorts', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const list = data?.items || data?.escorts || [];
          setItems(list);
        }
      } finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className={className}>
      <label className="block text-xs mb-1 text-gray-300">Seleziona Escort</label>
      <select
        value={value || 0}
        onChange={(e)=> onChange(Number(e.target.value))}
        className="bg-gray-800 border border-gray-600 text-white rounded-md px-3 py-2 w-full"
      >
        <option value={0}>{loading ? 'Caricamento…' : '— Scegli escort —'}</option>
        {items.map((it:any) => (
          <option key={it.id} value={it.userId}>{it.user?.nome ? `${it.user.nome} (User #${it.userId})` : `User #${it.userId}`}</option>
        ))}
      </select>
    </div>
  );
}
