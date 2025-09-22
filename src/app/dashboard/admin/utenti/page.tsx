"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function AdminUtentiPage() {
  type User = { 
    id: number; 
    nome: string; 
    email: string; 
    ruolo: string; 
    createdAt: string; 
    lastLogin?: string;
  };
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'user' | 'escort' | 'agency' | 'admin'>('all');

  useEffect(() => {
    loadUsers();
  }, [filter]);

  async function loadUsers() {
    try {
      const token = localStorage.getItem('auth-token');
      // Simulated data - replace with real API call
      setUsers([
        {
          id: 1,
          nome: "Mario Rossi",
          email: "mario@example.com",
          ruolo: "user",
          createdAt: "2025-01-20",
          lastLogin: "2025-01-22"
        },
        {
          id: 2,
          nome: "Giulia Bianchi",
          email: "giulia@example.com",
          ruolo: "escort",
          createdAt: "2025-01-21",
          lastLogin: "2025-01-22"
        }
      ]);
    } catch (error) {
      console.error('❌ Errore caricamento utenti:', error);
    } finally {
      setLoading(false);
    }
  }

  async function changeUserRole(userId: number, newRole: string) {
    try {
      console.log(`🔄 Cambio ruolo utente ${userId} a ${newRole}`);
      // API call here
      await loadUsers();
    } catch (error) {
      console.error('❌ Errore cambio ruolo:', error);
    }
  }

  async function deleteUser(userId: number) {
    if (!confirm('Sei sicuro di voler eliminare questo utente?')) return;
    
    try {
      console.log(`🗑️ Eliminazione utente ${userId}`);
      // API call here
      await loadUsers();
    } catch (error) {
      console.error('❌ Errore eliminazione utente:', error);
    }
  }

  const filteredUsers = filter === 'all' ? users : users.filter(u => u.ruolo === filter);

  return (
    <div className="space-y-6">
      <SectionHeader title="👥 Gestione Utenti" subtitle="Gestisci tutti gli utenti registrati" />

      {/* Filtri */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'user', 'escort', 'agency', 'admin'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === f 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {f === 'all' ? 'Tutti' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Caricamento utenti...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          Nessun utente trovato per il filtro selezionato
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-white">Nome</th>
                  <th className="px-4 py-3 text-left text-white">Email</th>
                  <th className="px-4 py-3 text-left text-white">Ruolo</th>
                  <th className="px-4 py-3 text-left text-white">Registrato</th>
                  <th className="px-4 py-3 text-left text-white">Ultimo Login</th>
                  <th className="px-4 py-3 text-left text-white">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-t border-gray-600">
                    <td className="px-4 py-3 text-white">{user.nome}</td>
                    <td className="px-4 py-3 text-gray-300">{user.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={user.ruolo}
                        onChange={(e) => changeUserRole(user.id, e.target.value)}
                        className="bg-gray-600 text-white rounded px-2 py-1 text-sm"
                      >
                        <option value="user">User</option>
                        <option value="escort">Escort</option>
                        <option value="agency">Agency</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">{user.createdAt}</td>
                    <td className="px-4 py-3 text-gray-400 text-sm">{user.lastLogin || 'Mai'}</td>
                    <td className="px-4 py-3">
                      <Button
                        onClick={() => deleteUser(user.id)}
                        className="bg-red-600 hover:bg-red-700 text-xs px-2 py-1"
                      >
                        Elimina
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
