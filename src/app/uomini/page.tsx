"use client";

import Link from "next/link";
import SeoHead from "@/components/SeoHead";

export default function UominiPage() {
  const cats = [
    { slug: "escort", label: "Escort", desc: "Accompagnatrici per incontri e serate", href: "/annunci" },
    { slug: "gigolo", label: "Gigolo", desc: "Accompagnatori per lei e coppie", href: "/annunci?type=GIGOLO" },
    { slug: "trans", label: "Trans", desc: "Transex e TGirl verificate", href: "/annunci?type=TRANS" },
    { slug: "coppie", label: "Coppie", desc: "Annunci per giochi di coppia", href: "/annunci?type=COPPIA" },
    { slug: "massaggi", label: "Centro Massaggi", desc: "Relax, tantra, body massage", href: "/annunci?type=MASSAGGI" },
  ];
  const tips = [
    { t: "Profilo verificato", d: "Preferisci profili con badge ✓ Verificato (documenti + foto)." },
    { t: "Recensioni", d: "Leggi le esperienze di altri utenti prima di contattare." },
    { t: "Sicurezza", d: "Non inviare caparre non richieste. Paga solo sul posto." },
    { t: "Riservatezza", d: "Usa chat e contatti ufficiali del profilo." },
  ];
  return (
    <>
      <SeoHead
        title="Uomini | Incontriescort.org"
        description="Consigli e categorie per trovare l'accompagnatrice(o) ideale e filtrare la ricerca."
        canonicalPath="/uomini"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Uomini",
          url: (process.env.NEXT_PUBLIC_SITE_URL || "https://incontriescort.org") + "/uomini",
        }}
      />
    <main className="container mx-auto px-4 py-8 min-h-[calc(100vh-80px)]">
      {/* Hero */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Uomini</h1>
        <p className="text-gray-300 mt-2">Trova l'accompagnatrice(o) ideale, leggi consigli e filtra per categoria.</p>
      </div>

      {/* Categorie */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 mb-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cats.map(c => (
            <Link key={c.slug} href={c.href} className="rounded-md border border-gray-600 bg-gray-900 p-4 hover:border-blue-600 transition">
              <div className="text-white font-semibold">{c.label}</div>
              <div className="text-sm text-gray-400">{c.desc}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Consigli rapidi */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 mb-6">
        <div className="text-white font-semibold mb-3">Consigli utili</div>
        <div className="grid md:grid-cols-2 gap-3">
          {tips.map((x,i) => (
            <div key={i} className="border border-gray-600 rounded-md p-3 bg-gray-900">
              <div className="text-sm text-white">{x.t}</div>
              <div className="text-xs text-gray-400">{x.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 text-center">
        <div className="text-white font-semibold mb-2">Inizia ora la tua ricerca</div>
        <div className="text-gray-400 mb-3">Filtra per città, categoria e priorità</div>
        <div className="flex items-center justify-center gap-3">
          <Link href="/annunci" className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">Vedi tutti gli annunci</Link>
          <Link href="/ricerca-citta" className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold">Ricerca per città</Link>
        </div>
      </div>
    </main>
    </>
  );
}
