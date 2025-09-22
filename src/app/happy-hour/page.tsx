"use client";

export default function HappyHourPage() {
  return (
    <main className="container mx-auto px-4 py-8 min-h-[calc(100vh-80px)]">
      <h1 className="text-3xl font-bold text-white mb-2">Happy Hour</h1>
      <span className="inline-block text-xs font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full mb-4">Coming soon</span>
      <p className="text-gray-300 mb-6">Promozioni e sconti a tempo per aumentare la visibilità.</p>
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 text-gray-300">
        Le offerte Happy Hour saranno disponibili qui.
      </div>
    </main>
  );
}
