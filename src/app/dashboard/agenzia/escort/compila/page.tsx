"use client";

import SectionHeader from "@/components/SectionHeader";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function Inner() {
  const params = useSearchParams();
  const escortUserId = Number(params?.get("escortUserId") || 0);

  const steps = [
    { key: "biografia", label: "Biografia", href: `/dashboard/agenzia/escort/compila/biografia?escortUserId=${escortUserId}` },
    { key: "contatti", label: "Contatti", href: `/dashboard/agenzia/escort/compila/contatti?escortUserId=${escortUserId}` },
    { key: "lingue", label: "Lingue", href: `/dashboard/agenzia/escort/compila/lingue?escortUserId=${escortUserId}` },
    { key: "citta-di-lavoro", label: "Città di Lavoro", href: `/dashboard/agenzia/escort/compila/citta-di-lavoro?escortUserId=${escortUserId}` },
    // In arrivo: servizi, tariffe, orari, galleria-foto, video
  ];

  return (
    <div className="space-y-6">
      <SectionHeader title="Compila Profilo Escort" subtitle={escortUserId ? `User #${escortUserId}` : "Missing escortUserId"} />

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <div className="text-sm text-gray-300 mb-3">Completa i passaggi nell'ordine per pubblicare correttamente il profilo.</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {steps.map(s => (
            <Link key={s.key} href={s.href} className="block border border-gray-600 rounded-md p-3 hover:border-blue-400">
              <div className="text-white font-semibold">{s.label}</div>
              <div className="text-xs text-gray-400">Configura {s.label.toLowerCase()}</div>
            </Link>
          ))}
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="text-xs text-gray-400">Una volta completati tutti i passaggi, invia il profilo in revisione.</div>
          <form onSubmit={async (e)=>{ e.preventDefault(); if(!escortUserId) return; 
            const res = await fetch('/api/agency/escort/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ escortUserId }) });
            const j = await res.json(); if(!res.ok){ alert(j?.error||'Errore invio'); } else { alert('Profilo inviato in revisione'); }
          }}>
            <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded" disabled={!escortUserId}>Invia in revisione</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AgencyEscortCompileHubPage() {
  return (
    <Suspense fallback={<div className="text-sm text-gray-400">Caricamento…</div>}>
      <Inner />
    </Suspense>
  );
}
