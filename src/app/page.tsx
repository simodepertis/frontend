"use client";

import { Dropdown } from "@/components/ui/dropdown";
import Image from "next/image";
import { useState } from "react";
import { faCheckCircle, faCrown, faIdBadge, faStar, faUser, } from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const escorts = [
	{
		id: 1,
		nome: "Giulia",
		eta: 25,
		citta: "Milano",
		capelli: "Biondi",
		prezzo: 150,
		foto: "https://i.escortforumit.xxx/686685/profile/deef0002-437f-4464-a781-8ac4843488f4_profile.jpg?v=5",
		descrizione: "Elegante, raffinata e sempre sorridente.",
		rank: "VIP",
	},
	{
		id: 2,
		nome: "Martina",
		eta: 28,
		citta: "Roma",
		capelli: "Castani",
		prezzo: 200,
		foto: "https://i.escortforumit.xxx/710869/profile/9c6cc2e7-5ad8-4684-bd96-fdfcfd6faa58_thumb_750.jpg?v=1",
		descrizione: "Solare, sportiva e amante dell’avventura.",
		rank: "ORO",
	},
	{
		id: 3,
		nome: "Sara",
		eta: 23,
		citta: "Firenze",
		capelli: "Neri",
		prezzo: 180,
		foto: "https://i.escortforumit.xxx/376078/profile/190aa487-a2dd-43ee-a4c2-5dff8c5fab49_thumb_750.jpg?v=1",
		descrizione: "Dolce, riservata e molto professionale.",
		rank: "ARGENTO",
	},
  {
		id: 4,
		nome: "Sara",
		eta: 23,
		citta: "Firenze",
		capelli: "Neri",
		prezzo: 180,
		foto: "https://i.escortforumit.xxx/703461/profile/28a91e4c-c6c3-4639-bae9-aeab4cbad15c_thumb_750.jpg?v=1",
		descrizione: "Dolce, riservata e molto professionale.",
		rank: "TITANIUM",
	},
  {
		id: 5,
		nome: "Sara",
		eta: 23,
		citta: "Firenze",
		capelli: "Neri",
		prezzo: 180,
		foto: "https://i.escortforumit.xxx/686141/profile/80cb7136-bcc1-4c01-9430-b8cbedd43a21_thumb_750.jpg?v=1",
		descrizione: "Dolce, riservata e molto professionale.",
		rank: "VIP",
	},
  {
		id: 6,
		nome: "Sara",
		eta: 23,
		citta: "Firenze",
		capelli: "Neri",
		prezzo: 180,
		foto: "https://i.escortforumit.xxx/708057/profile/7040775e-d371-48b6-b310-6424e5ed3cd6_thumb_750.jpg?v=1",
		descrizione: "Dolce, riservata e molto professionale.",
		rank: "ORO",
	},
];

const cittaOptions = ["Milano", "Roma", "Firenze"];
const capelliOptions = ["Biondi", "Castani", "Neri"];

export default function Home() {
	const [filtroCitta, setFiltroCitta] = useState("");
	const [filtroCapelli, setFiltroCapelli] = useState("");
	const [filtroEta, setFiltroEta] = useState("");
	const [filtroPrezzo, setFiltroPrezzo] = useState("");

	const escortsFiltrate = escorts.filter((e) => {
		return (
			(!filtroCitta || e.citta === filtroCitta) &&
			(!filtroCapelli || e.capelli === filtroCapelli) &&
			(!filtroEta || e.eta === Number(filtroEta)) &&
			(!filtroPrezzo || e.prezzo <= Number(filtroPrezzo))
		);
	});

	return (
		<main className="max-w-6xl mx-auto w-full px-4 py-8">
			<div className="mb-8 flex flex-col md:flex-row gap-4 justify-center w-full">
				<Dropdown
					label="Filtra risultati"
					className="w-full md:flex-1 md:min-w-[500px]"
				>
					<div className="flex flex-col gap-3">
						<select
							className="border rounded px-3 py-2 focus:outline-none focus:ring"
							value={filtroCitta}
							onChange={(e) => setFiltroCitta(e.target.value)}
						>
							<option value="">Tutte le città</option>
							{cittaOptions.map((c) => (
								<option key={c} value={c}>
									{c}
								</option>
							))}
						</select>
						<select
							className="border rounded px-3 py-2 focus:outline-none focus:ring"
							value={filtroCapelli}
							onChange={(e) => setFiltroCapelli(e.target.value)}
						>
							<option value="">Tutti i capelli</option>
							{capelliOptions.map((c) => (
								<option key={c} value={c}>
									{c}
								</option>
							))}
						</select>
						<input
							type="number"
							min="18"
							max="99"
							placeholder="Età massima"
							className="border rounded px-3 py-2 focus:outline-none focus:ring"
							value={filtroEta}
							onChange={(e) => setFiltroEta(e.target.value)}
						/>
						<input
							type="number"
							min="0"
							placeholder="Prezzo massimo (€)"
							className="border rounded px-3 py-2 focus:outline-none focus:ring"
							value={filtroPrezzo}
							onChange={(e) => setFiltroPrezzo(e.target.value)}
						/>
					</div>
				</Dropdown>
			</div>
			<div className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
				{escortsFiltrate.length === 0 && (
					<div className="col-span-full text-center text-neutral-500">
						Nessun risultato trovato.
					</div>
				)}
				{escortsFiltrate.map((escort) => {
  let badge = null;
  let borderColor = "border-yellow-400/60";
  if (escort.rank === "VIP") {
    badge = (
      <div className="absolute top-0 left-0 z-10 bg-yellow-400/40 text-white px-4 py-2 rounded-br-lg text-sm flex items-center gap-2 shadow-md">
        <span className="relative flex items-center">
          <FontAwesomeIcon
            icon={faCrown}
            className="text-yellow-500 text-lg drop-shadow-[0_0_1px_black]"
            style={{ WebkitTextStroke: '1px black' }}
          />
        </span>
        <span className="font-bold">VIP</span>
      </div>
    );
    borderColor = "border-yellow-400/60";
  } else if (escort.rank === "ORO") {
    badge = (
      <div className="absolute top-0 left-0 z-10 bg-yellow-300/40 text-yellow-900 px-4 py-2 rounded-br-lg text-sm flex items-center gap-2 shadow-md">
        <FontAwesomeIcon icon={faStar} className="text-yellow-500 text-lg" />
        <span className="font-bold">ORO</span>
      </div>
    );
    borderColor = "border-yellow-300/60";
  } else if (escort.rank === "ARGENTO") {
    badge = (
      <div className="absolute top-0 left-0 z-10 bg-gray-300/60 text-gray-800 px-4 py-2 rounded-br-lg text-sm flex items-center gap-2 shadow-md">
        <FontAwesomeIcon icon={faIdBadge} className="text-gray-500 text-lg" />
        <span className="font-bold">ARGENTO</span>
      </div>
    );
    borderColor = "border-gray-300/60";
  } else if (escort.rank === "TITANIUM") {
    badge = (
      <div className="absolute top-0 left-0 z-10 bg-blue-900/80 text-blue-100 px-4 py-2 rounded-br-lg text-sm flex items-center gap-2 shadow-md">
        <FontAwesomeIcon icon={faUser} className="text-blue-200 text-lg" />
        <span className="font-bold">TITANIUM</span>
      </div>
    );
    borderColor = "border-blue-900/60";
  }
  return (
    <div
      key={escort.id}
      className={`bg-white rounded-xl shadow p-0 flex flex-col items-center text-center border-4 ${borderColor} overflow-hidden`}
    >
      <div className="w-full h-[500px] relative">
        {badge}
        <div className="absolute bottom-10 left-3 z-10 bg-black/20 px-3 py-1 rounded text-white text-md flex items-center gap-1">
          <div className="text-white-800 font-bold text-2xl">{escort.nome}</div>
          <div className="text-white-800 font-bold text-2md">{escort.eta}</div>
        </div>
        <div className="absolute bottom-3 left-3 z-10 bg-black/20 px-3 py-1 rounded text-white text-xs flex items-center gap-2">
          {/* Badge Verificata */}
          <div className="relative group">
            <FontAwesomeIcon icon={faIdBadge} className="text-green-400 text-sm" />
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-black text-white text-xs opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">Verificata</span>
          </div>
          {/* WhatsApp */}
          <div className="relative group">
            <FontAwesomeIcon icon={faWhatsapp} className="text-green-400 text-sm" />
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-black text-white text-xs opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">WhatsApp</span>
          </div>
        </div>
        <Image
          src={escort.foto}
          alt={escort.nome}
          fill
          className="object-cover w-full h-full"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
    </div>
  );
})}
			</div>
		</main>
	);
}
