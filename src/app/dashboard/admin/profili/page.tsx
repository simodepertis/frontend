"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function AdminProfiliPage() {
  type Profile = { 
    id: number; 
    userId: number; 
    nome: string; 
    email: string; 
    tier: string; 
    verified: boolean; 
    createdAt: string; 
    cities: string[];
  };
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, []);

  async function loadProfiles() {
    try {
      const token = localStorage.getItem('auth-token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const response = await fetch('/api/admin/profiles', { headers });
      
      if (response.ok) {
        const data = await response.json();
        setProfiles(data.profiles);
        console.log('✅ Profili admin caricati:', data.profiles);
      } else {
        console.error('❌ Errore risposta API profili:', response.status);
        setProfiles([]);
      }
    } catch (error) {
      console.error('❌ Errore caricamento profili:', error);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }

  async function approveProfile(profileId: number) {
    try {
      const token = localStorage.getItem('auth-token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const response = await fetch('/api/admin/profiles', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          profileId,
          action: 'approve'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Profilo approvato:', data.message);
        await loadProfiles();
      } else {
        console.error('❌ Errore approvazione profilo:', response.status);
      }
    } catch (error) {
      console.error('❌ Errore approvazione profilo:', error);
    }
  }

  async function rejectProfile(profileId: number) {
    try {
      const token = localStorage.getItem('auth-token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const response = await fetch('/api/admin/profiles', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          profileId,
          action: 'reject'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('❌ Profilo rifiutato:', data.message);
        await loadProfiles();
      } else {
        console.error('❌ Errore rifiuto profilo:', response.status);
      }
    } catch (error) {
      console.error('❌ Errore rifiuto profilo:', error);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="👤 Approvazione Profili" subtitle="Verifica e approva i profili escort" />

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Caricamento profili...</p>
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          Nessun profilo in attesa di approvazione
        </div>
      ) : (
        <div className="space-y-4">
          {profiles.map((profile) => (
            <div key={profile.id} className="bg-gray-800 rounded-lg p-6 border border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{profile.nome}</h3>
                  <p className="text-gray-400">{profile.email}</p>
                  <p className="text-sm text-gray-500">
                    Tier: {profile.tier} • Città: {profile.cities.join(', ')}
                  </p>
                  <p className="text-xs text-gray-500">Creato: {profile.createdAt}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => approveProfile(profile.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Approva
                  </Button>
                  <Button 
                    onClick={() => rejectProfile(profile.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Rifiuta
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
