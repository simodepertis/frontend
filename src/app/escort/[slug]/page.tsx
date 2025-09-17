"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import SectionHeader from "@/components/SectionHeader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot, faBirthdayCake, faEuroSign, faShieldHeart, faStar } from "@fortawesome/free-solid-svg-icons";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function EscortDetailPage({ params }: { params: { slug: string } }) {
  // Mock detail by slug (in futuro: fetch server/data)
  const escort = {
    slug: params.slug,
    nome: params.slug.split("-")[0]?.toUpperCase() || "Modella",
    eta: 25,
    citta: "Milano",
    prezzo: 150,
    descrizione: "Descrizione di esempio della modella, preferenze e disponibilità.",
    foto: [
      "https://i.escortforumit.xxx/686685/profile/deef0002-437f-4464-a781-8ac4843488f4_profile.jpg?v=5",
      "https://i.escortforumit.xxx/708057/profile/7040775e-d371-48b6-b310-6424e5ed3cd6_thumb_750.jpg?v=1",
    ],
  };

  const [active, setActive] = useState(0);
  const [tab, setTab] = useState<string>("descrizione");

  return (
    <main className="container mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Escort", href: "/escort" }, { label: escort.nome }]} />
      <SectionHeader title={`${escort.nome}, ${escort.eta}`} subtitle={`Profilo a ${escort.citta}`} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-2">
        {/* Galleria */}
        <div className="md:col-span-2 bg-white rounded-xl border shadow-sm p-4">
          <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden">
            <Image src={escort.foto[active]} alt={`${escort.nome} principale`} fill className="object-cover" />
          </div>
          <div className="mt-3 grid grid-cols-4 sm:grid-cols-6 gap-2">
            {escort.foto.map((src, idx) => (
              <button
                key={idx}
                onClick={() => setActive(idx)}
                className={`relative w-full aspect-square rounded-md overflow-hidden border ${active === idx ? 'ring-2 ring-red-500' : 'border-neutral-200'}`}
              >
                <Image src={src} alt={`${escort.nome} thumb ${idx+1}`} fill className="object-cover" />
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-2 bg-neutral-100 border rounded-full px-3 py-1">
              <FontAwesomeIcon icon={faLocationDot} className="text-neutral-600" /> {escort.citta}
            </span>
            <span className="inline-flex items-center gap-2 bg-neutral-100 border rounded-full px-3 py-1">
              <FontAwesomeIcon icon={faBirthdayCake} className="text-neutral-600" /> {escort.eta} anni
            </span>
            <span className="inline-flex items-center gap-2 bg-neutral-100 border rounded-full px-3 py-1">
              <FontAwesomeIcon icon={faEuroSign} className="text-neutral-600" /> € {escort.prezzo}
            </span>
          </div>

          <div className="mt-5">
            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList className="grid grid-cols-4 md:w-2/3">
                <TabsTrigger value="descrizione">Descrizione</TabsTrigger>
                <TabsTrigger value="servizi">Servizi</TabsTrigger>
                <TabsTrigger value="disponibilita">Disponibilità</TabsTrigger>
                <TabsTrigger value="recensioni">Recensioni</TabsTrigger>
              </TabsList>
              <TabsContent value="descrizione">
                <div className="mt-4">
                  <p className="text-neutral-700 leading-7">{escort.descrizione}</p>
                </div>
              </TabsContent>
              <TabsContent value="servizi">
                <div className="mt-4">
                  <ul className="list-disc list-inside text-neutral-700 space-y-1">
                    <li>Incontri in hotel</li>
                    <li>Accompagnamento eventi</li>
                    <li>Disponibilità su appuntamento</li>
                  </ul>
                </div>
              </TabsContent>
              <TabsContent value="disponibilita">
                <div className="mt-4 text-neutral-700">Lun–Ven 10:00–20:00 · Sab 12:00–18:00 · Dom chiuso</div>
              </TabsContent>
              <TabsContent value="recensioni">
                <div className="mt-4 space-y-3 text-sm">
                  <div className="p-3 border rounded-lg bg-neutral-50">
                    <div className="font-semibold text-neutral-800">Ottima esperienza</div>
                    <div className="text-xs text-neutral-500 mb-1">Alessio · Milano</div>
                    <p className="text-neutral-700">Gentile e puntuale, servizio come da descrizione.</p>
                  </div>
                  <div className="p-3 border rounded-lg bg-neutral-50">
                    <div className="font-semibold text-neutral-800">Professionale</div>
                    <div className="text-xs text-neutral-500 mb-1">Giorgia · Monza</div>
                    <p className="text-neutral-700">Ambiente riservato, tutto perfetto.</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="bg-neutral-50 rounded-xl border shadow-sm p-4 h-fit">
          <div className="text-2xl font-bold">€ {escort.prezzo}</div>
          <div className="mt-2 text-xs text-neutral-500">Tariffa indicativa</div>
          <button className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white rounded-md py-2.5 font-semibold">Contatta</button>
          <button className="mt-2 w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-md py-2">Salva profilo</button>
          <div className="mt-4 border-t pt-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-neutral-700">
              <FontAwesomeIcon icon={faShieldHeart} className="text-green-600" /> Verificata manualmente
            </div>
            <div className="flex items-center gap-2 text-neutral-700">
              <FontAwesomeIcon icon={faStar} className="text-amber-500" /> Preferita da 128 utenti
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
