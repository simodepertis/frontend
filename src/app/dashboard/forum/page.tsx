"use client";

import SectionHeader from "@/components/SectionHeader";
import Link from "next/link";
import { useMemo } from "react";

export default function ForumPage() {
  const threads = useMemo(() => (
    [
      { id: 1, author: "stpc10", title: "Heading to Naples this weekend. Any good recommendations for clubs/bars?", date: "28 ago, 2025", replies: 12 },
      { id: 2, author: "marco88", title: "Milano: consigli zona Porta Romana?", date: "22 ago, 2025", replies: 5 },
      { id: 3, author: "luca_travel", title: "Esperienze a Firenze centro storico", date: "19 ago, 2025", replies: 7 },
    ]
  ), []);

  return (
    <div className="space-y-6">
      <SectionHeader title="Forum" subtitle="Discussioni e commenti" />

      <div className="rounded-lg border border-gray-600 bg-gray-800 divide-y divide-gray-700">
        {threads.map((t) => (
          <div key={t.id} className="p-4 flex items-start gap-4">
            <div className="text-sm text-gray-400 w-28 shrink-0">{t.date}</div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">{t.author}</div>
              <div className="text-gray-300">{t.title}</div>
            </div>
            <div className="w-32 text-right">
              <div className="text-xs text-gray-400">{t.replies} risposte</div>
              <Link href="/dashboard/forum" className="text-blue-400 hover:underline text-sm">Rispondi</Link>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-gray-600 bg-gray-800 p-4">
        <h3 className="font-semibold mb-2 text-white">Crea una nuova discussione</h3>
        <p className="text-sm text-gray-400">Form in arrivo; per ora usa le discussioni esistenti.</p>
      </div>
    </div>
  );
}
