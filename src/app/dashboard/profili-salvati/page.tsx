"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProfiliSalvatiPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('auth-token');
        if (!token) {
          setProfiles([]);
          setLoading(false);
          return;
        }

        const res = await fetch('/api/user/saved-profiles', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setProfiles(data.savedProfiles || []);
        } else {
          setProfiles([]);
        }
      } catch (error) {
        console.error('Errore caricamento profili salvati:', error);
        setProfiles([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const remove = async (targetUserId: number) => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) return;

      const res = await fetch('/api/user/saved-profiles', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetUserId })
      });

      if (res.ok) {
        setProfiles((xs) => xs.filter(x => x.targetUserId !== targetUserId));
      } else {
        const error = await res.json();
        alert(error.error || 'Errore rimozione profilo salvato');
      }
    } catch (error) {
      console.error('Errore rimozione profilo salvato:', error);
      alert('Errore rimozione profilo salvato');
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Profili Salvati" subtitle="I profili escort che hai salvato per consultarli facilmente" />

      <div className="space-y-3">
        <div className="text-sm text-gray-400">
          {loading ? 'Caricamento...' : `${profiles.length} profili salvati`}
        </div>
        
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="border border-gray-600 rounded-lg overflow-hidden bg-gray-800 shadow-sm animate-pulse">
                <div className="w-full aspect-[3/4] bg-gray-700"></div>
                <div className="p-2">
                  <div className="h-4 bg-gray-700 rounded mb-1"></div>
                  <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>Non hai ancora salvato nessun profilo.</p>
            <p className="text-sm mt-2">Visita i profili delle escort e clicca su "Salva profilo" per aggiungerli qui!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {profiles.map((profile) => (
              <div key={profile.id} className="group border border-gray-600 rounded-lg overflow-hidden bg-gray-800 shadow-sm">
                <Link href={`/escort/${profile.slug}`} className="block">
                  <div className="relative w-full aspect-[3/4]">
                    <Image src={profile.photo} alt={profile.nome} fill className="object-cover group-hover:scale-105 transition-transform" />
                    {profile.tier && profile.tier !== 'STANDARD' && (
                      <div className="absolute top-2 left-2 bg-yellow-600 text-white text-xs rounded px-2 py-1">
                        {profile.tier}
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-2">
                  <div className="text-sm font-semibold truncate text-white">{profile.nome}</div>
                  <div className="text-xs text-gray-400 truncate">{profile.city}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Salvato il {new Date(profile.savedAt).toLocaleDateString()}
                  </div>
                  <div className="mt-2">
                    <Button variant="secondary" size="sm" onClick={() => remove(profile.targetUserId)} className="w-full">
                      Rimuovi
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
