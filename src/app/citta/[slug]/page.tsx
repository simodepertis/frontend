export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const city = slug.replace(/-/g, " ");
  return {
    title: `Escort a ${city} | Trova Compagnia` ,
    description: `Annunci escort a ${city}. Cerca per preferenze e contatta in modo sicuro.`,
    alternates: { canonical: `/citta/${slug}` },
  };
}
import CityClient from "./CityClient";

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const city = slug.replace(/-/g, " ");
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-neutral-800">Escort a {city}</h1>
      <CityClient city={city} />
    </main>
  );
}
