"use client";

import SectionHeader from "@/components/SectionHeader";

export default function StoriePage() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Storie" subtitle="Condivisioni e aggiornamenti dell'agenzia" />

      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 text-gray-300">
        <p className="mb-2">Non ci sono storie al momento.</p>
        <p className="text-gray-400 text-sm">La funzionalità sarà abilitata quando verranno pubblicate le prime storie.</p>
      </div>
    </div>
  );
}
