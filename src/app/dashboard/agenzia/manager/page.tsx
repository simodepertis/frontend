"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/SectionHeader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEdit, faTrash, faEye, faUserCheck, faUserTimes } from "@fortawesome/free-solid-svg-icons";

type EscortProfile = {
  id: number;
  name: string;
  age: number;
  city: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  tier: 'FREE' | 'SILVER' | 'GOLD' | 'VIP';
  photos: number;
  videos: number;
  lastActive: string;
  earnings: number;
  bookings: number;
};

export default function AgencyManagerPage() {
  const [profiles, setProfiles] = useState<EscortProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProfile, setNewProfile] = useState({
    name: '',
    age: 18,
    city: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    loadProfiles();
  }, []);

  async function loadProfiles() {
    setLoading(true);
    try {
      const res = await fetch('/API/agency/escorts');
      if (res.ok) {
        const { escorts } = await res.json();
        setProfiles(escorts || []);
      }
    } catch (error) {
      console.error('Errore caricamento profili:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createProfile() {
    if (!newProfile.name.trim() || !newProfile.city.trim() || !newProfile.email.trim()) {
      alert('Compila tutti i campi obbligatori');
      return;
    }

    try {
      const res = await fetch('/API/agency/escorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProfile)
      });

      if (res.ok) {
        await loadProfiles();
        setNewProfile({ name: '', age: 18, city: '', email: '', phone: '' });
        setShowAddForm(false);
        alert('Profilo creato con successo!');
      } else {
        const data = await res.json();
        alert(data?.error || 'Errore creazione profilo');
      }
    } catch (error) {
      alert('Errore di rete');
    }
  }

  async function updateProfileStatus(id: number, status: string) {
    try {
      const res = await fetch('/API/agency/escorts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });

      if (res.ok) {
        await loadProfiles();
      } else {
        alert('Errore aggiornamento stato');
      }
    } catch (error) {
      alert('Errore di rete');
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-900/40 text-green-300 border border-green-700';
      case 'inactive': return 'bg-gray-800 text-gray-300 border border-gray-600';
      case 'pending': return 'bg-yellow-900/30 text-yellow-300 border border-yellow-700';
      case 'suspended': return 'bg-red-900/40 text-red-300 border border-red-700';
      default: return 'bg-gray-800 text-gray-300 border border-gray-600';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'VIP': return 'bg-purple-900/40 text-purple-200 border-purple-700';
      case 'GOLD': return 'bg-yellow-900/30 text-yellow-200 border-yellow-700';
      case 'SILVER': return 'bg-gray-800 text-gray-200 border-gray-600';
      default: return 'bg-blue-900/30 text-blue-200 border-blue-700';
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Manager Agenzia" 
        subtitle="Gestisci tutti i profili escort della tua agenzia" 
      />

      {/* Statistiche generali */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg border border-gray-600 p-4">
          <div className="text-2xl font-bold text-green-400">{profiles.filter(p => p.status === 'active').length}</div>
          <div className="text-sm text-gray-300">Profili Attivi</div>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-600 p-4">
          <div className="text-2xl font-bold text-yellow-400">{profiles.filter(p => p.status === 'pending').length}</div>
          <div className="text-sm text-gray-300">In Approvazione</div>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-600 p-4">
          <div className="text-2xl font-bold text-blue-400">€{profiles.reduce((sum, p) => sum + p.earnings, 0).toFixed(2)}</div>
          <div className="text-sm text-gray-300">Guadagni Totali</div>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-600 p-4">
          <div className="text-2xl font-bold text-purple-400">{profiles.reduce((sum, p) => sum + p.bookings, 0)}</div>
          <div className="text-sm text-gray-300">Prenotazioni Totali</div>
        </div>
      </div>

      {/* Azioni principali */}
      <div className="bg-gray-800 rounded-lg border border-gray-600 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Gestione Profili</h3>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Aggiungi Nuovo Profilo
          </Button>
        </div>

        {/* Form aggiunta profilo */}
        {showAddForm && (
          <div className="bg-gray-900 rounded-lg p-4 mb-4 border border-gray-700">
            <h4 className="font-semibold mb-3 text-white">Nuovo Profilo Escort</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Nome *</label>
                <input
                  type="text"
                  value={newProfile.name}
                  onChange={(e) => setNewProfile(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-600 bg-gray-700 text-white rounded-lg px-3 py-2"
                  placeholder="Nome escort"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Età</label>
                <input
                  type="number"
                  min="18"
                  max="65"
                  value={newProfile.age}
                  onChange={(e) => setNewProfile(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                  className="w-full border border-gray-600 bg-gray-700 text-white rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Città *</label>
                <input
                  type="text"
                  value={newProfile.city}
                  onChange={(e) => setNewProfile(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full border border-gray-600 bg-gray-700 text-white rounded-lg px-3 py-2"
                  placeholder="Milano, Roma, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Email *</label>
                <input
                  type="email"
                  value={newProfile.email}
                  onChange={(e) => setNewProfile(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full border border-gray-600 bg-gray-700 text-white rounded-lg px-3 py-2"
                  placeholder="email@esempio.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Telefono</label>
                <input
                  type="tel"
                  value={newProfile.phone}
                  onChange={(e) => setNewProfile(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full border border-gray-600 bg-gray-700 text-white rounded-lg px-3 py-2"
                  placeholder="+39 333 123 4567"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={createProfile} className="bg-green-600 hover:bg-green-700 text-white">
                Crea Profilo
              </Button>
              <Button 
                onClick={() => setShowAddForm(false)} 
                variant="secondary"
              >
                Annulla
              </Button>
            </div>
          </div>
        )}

        {/* Lista profili */}
        {loading ? (
          <div className="text-center py-8">Caricamento profili...</div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nessun profilo escort ancora creato. Inizia aggiungendo il primo profilo!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-gray-300">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-2">Nome</th>
                  <th className="text-left py-3 px-2">Età</th>
                  <th className="text-left py-3 px-2">Città</th>
                  <th className="text-left py-3 px-2">Stato</th>
                  <th className="text-left py-3 px-2">Tier</th>
                  <th className="text-left py-3 px-2">Media</th>
                  <th className="text-left py-3 px-2">Guadagni</th>
                  <th className="text-left py-3 px-2">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => (
                  <tr key={profile.id} className="border-b border-gray-700 hover:bg-gray-800/60">
                    <td className="py-3 px-2 font-medium text-white">{profile.name}</td>
                    <td className="py-3 px-2">{profile.age}</td>
                    <td className="py-3 px-2">{profile.city}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(profile.status)}`}>
                        {profile.status === 'active' ? 'Attivo' : 
                         profile.status === 'inactive' ? 'Inattivo' : 
                         profile.status === 'pending' ? 'In Approvazione' : 'Sospeso'}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded border text-xs font-medium ${getTierColor(profile.tier)}`}>
                        {profile.tier}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-sm">
                      {profile.photos} foto, {profile.videos} video
                    </td>
                    <td className="py-3 px-2 font-medium text-green-400">
                      €{profile.earnings.toFixed(2)}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex gap-1">
                        <button
                          onClick={() => window.open(`/escort/${profile.name.toLowerCase().replace(/\s+/g, '-')}-${profile.id}`, '_blank')}
                          className="p-1 text-blue-400 hover:bg-blue-900/30 rounded"
                          title="Visualizza profilo"
                        >
                          <FontAwesomeIcon icon={faEye} size="sm" />
                        </button>
                        <button
                          onClick={() => window.open(`/dashboard/escort/compila?id=${profile.id}`, '_blank')}
                          className="p-1 text-green-400 hover:bg-green-900/30 rounded"
                          title="Modifica profilo"
                        >
                          <FontAwesomeIcon icon={faEdit} size="sm" />
                        </button>
                        {profile.status === 'active' ? (
                          <button
                            onClick={() => updateProfileStatus(profile.id, 'inactive')}
                            className="p-1 text-yellow-400 hover:bg-yellow-900/30 rounded"
                            title="Disattiva"
                          >
                            <FontAwesomeIcon icon={faUserTimes} size="sm" />
                          </button>
                        ) : (
                          <button
                            onClick={() => updateProfileStatus(profile.id, 'active')}
                            className="p-1 text-green-400 hover:bg-green-900/30 rounded"
                            title="Attiva"
                          >
                            <FontAwesomeIcon icon={faUserCheck} size="sm" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
