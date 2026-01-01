"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useState } from "react";

export default function CertificazioneEtaPage() {
  const [loading, setLoading] = useState(true);
  const [approved, setApproved] = useState<Array<any>>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('auth-token') || '';
        const res = await fetch('/api/agency/escorts/certificazione-eta', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
        });
        if (res.ok) {
          const j = await res.json().catch(() => ({}));
          setApproved(Array.isArray(j?.approved) ? j.approved : []);
        } else {
          setApproved([]);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <SectionHeader title="Certificazione dell'Età" subtitle="Informazioni e stato richieste" />

      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 text-gray-300">
        <p className="mb-3">
          In conformità con le leggi della Svizzera, sul nostro sito non possono essere ragazze minorenni (meno di 18 anni).
          Inoltre, dobbiamo verificare che tutte le inserzioniste siano fisicamente in Italia. Queste misure sono prese al fine di
          proteggere i nostri clienti dalla pubblicità falsa.
        </p>

        <div className="mt-4">
          <div className="font-semibold text-white mb-2">Escort già certificate (documenti APPROVED)</div>
          {loading ? (
            <div className="text-sm text-gray-400">Caricamento…</div>
          ) : approved.length === 0 ? (
            <p className="italic text-gray-400">Non ci sono escort gestite con documenti approvati.</p>
          ) : (
            <div className="space-y-2">
              {approved.map((e: any) => (
                <div key={e.escortUserId} className="rounded-md border border-gray-600 bg-gray-900 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-white font-semibold">{e.nome || 'Escort'}</div>
                      <div className="text-xs text-gray-400">User #{e.escortUserId}{e.email ? ` · ${e.email}` : ''}</div>
                    </div>
                    <a
                      href={`/dashboard/agenzia/escort/compila/documenti?escortUserId=${e.escortUserId}`}
                      className="text-sm text-blue-400 hover:underline"
                    >
                      Vedi documenti
                    </a>
                  </div>
                  <div className="mt-2 text-xs text-gray-300">
                    Documenti approvati: {Array.isArray(e.approvedDocuments) ? e.approvedDocuments.length : 0}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
