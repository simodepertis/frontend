"use client";

import SectionHeader from "@/components/SectionHeader";

export default function CertificazioneEtaPage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Certificazione dell'Età" subtitle="Informazioni e stato richieste" />

      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 text-gray-300">
        <p className="mb-3">
          In conformità con le leggi della Svizzera, sul nostro sito non possono essere ragazze minorenni (meno di 18 anni).
          Inoltre, dobbiamo verificare che tutte le inserzioniste siano fisicamente in Italia. Queste misure sono prese al fine di
          proteggere i nostri clienti dalla pubblicità falsa.
        </p>
        <p className="italic text-gray-400">Non ci sono escort in attesa di Certificazione dell'Età.</p>
      </div>
    </div>
  );
}
