"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function AdminUtentiPage() {
  type User = { 
    id: number; 
    nome: string; 
    email: string; 
    ruolo: string; 
    createdAt: string; 
    lastLogin?: string;
    suspended?: boolean;
    hasEscortProfile?: boolean;
    counts?: {
      photosApproved: number;
      photosReview: number;
      videosApproved: number;
      videosReview: number;
      docsApproved: number;
    }
  };
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'user' | 'escort' | 'agency' | 'admin'>('all');
  const router = useRouter();

  useEffect(() => {
    loadUsers();
  }, [filter]);

  async function loadUsers() {
    try {
      const token = localStorage.getItem('auth-token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const url = filter === 'all' ? '/api/admin/users' : `/api/admin/users?role=${filter}`;
      const response = await fetch(url, { headers });
      
      if (response.ok) {
        const data = await response.json();
        const transformedUsers = data.users.map((user: any) => ({
          id: user.id,
          nome: user.nome,
          email: user.email,
          ruolo: user.ruolo,
          createdAt: String(user.createdAt).split('T')[0],
          lastLogin: 'N/A',
          suspended: !!user.suspended,
          hasEscortProfile: !!user.hasEscortProfile,
          counts: user.counts || { photosApproved: 0, photosReview: 0, videosApproved: 0, videosReview: 0, docsApproved: 0 }
        }));
        setUsers(transformedUsers);
        console.log('✅ Utenti admin caricati:', transformedUsers);
      } else {
        console.error('❌ Errore risposta API utenti:', response.status);
        setUsers([]);
      }

  async function suspendUser(userId: number, suspend: boolean) {
    try {
      const token = localStorage.getItem('auth-token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ userId, action: suspend ? 'suspend' : 'unsuspend' })
      });
      if (response.ok) {
        await loadUsers();
      } else {
        const d = await response.json().catch(()=>({error:'Errore'}));
        alert(d.error || 'Errore aggiornamento stato utente');
      }
    } catch (e) {
      console.error('❌ Errore sospensione utente:', e);
    }
  }
    } catch (error) {
      console.error('❌ Errore caricamento utenti:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  async function changeUserRole(userId: number, newRole: string) {
    try {
      const token = localStorage.getItem('auth-token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          userId,
          action: 'changeRole',
          newRole
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Ruolo utente cambiato:', data.user);
        await loadUsers();
      } else {
        console.error('❌ Errore cambio ruolo:', response.status);
      }
    } catch (error) {
      console.error('❌ Errore cambio ruolo:', error);
    }
  }

  async function deleteUser(userId: number) {
    if (!confirm('Sei sicuro di voler eliminare questo utente?')) return;
    
    try {
      const token = localStorage.getItem('auth-token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE',
        headers
      });
      
      if (response.ok) {
        console.log('✅ Utente eliminato con successo');
        await loadUsers();
      } else {
        const data = await response.json();
        console.error('❌ Errore eliminazione utente:', data.error);
        alert(`Errore: ${data.error}`);
      }
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
        <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-600">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-white">Nome</th>
                  <th className="px-4 py-3 text-left text-white">Email</th>
                  <th className="px-4 py-3 text-left text-white">Ruolo</th>
                  <th className="px-4 py-3 text-left text-white">Registrato</th>
                  <th className="px-4 py-3 text-left text-white">Ultimo Login</th>
                  <th className="px-4 py-3 text-left text-white">Foto OK</th>
                  <th className="px-4 py-3 text-left text-white">Foto Review</th>
                  <th className="px-4 py-3 text-left text-white">Video OK</th>
                  <th className="px-4 py-3 text-left text-white">Doc OK</th>
                  <th className="px-4 py-3 text-left text-white">Escort</th>
                  <th className="px-4 py-3 text-left text-white">Stato</th>
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
                        className="bg-gray-600 border border-gray-500 text-white rounded px-2 py-1 text-sm"
                      >
                        <option value="user">User</option>
                        <option value="escort">Escort</option>
                        <option value="agency">Agency</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">{user.createdAt}</td>
                    <td className="px-4 py-3 text-gray-400 text-sm">{user.lastLogin || 'Mai'}</td>
                    <td className="px-4 py-3 text-gray-300 text-sm">{user.counts?.photosApproved ?? 0}</td>
                    <td className="px-4 py-3 text-gray-300 text-sm">{user.counts?.photosReview ?? 0}</td>
                    <td className="px-4 py-3 text-gray-300 text-sm">{user.counts?.videosApproved ?? 0}</td>
                    <td className="px-4 py-3 text-gray-300 text-sm">{user.counts?.docsApproved ?? 0}</td>
                    <td className="px-4 py-3 text-gray-300 text-sm">{user.hasEscortProfile ? 'Sì' : 'No'}</td>
                    <td className="px-4 py-3 text-sm">{user.suspended ? <span className="px-2 py-1 rounded bg-red-700 text-white text-xs">Sospeso</span> : <span className="px-2 py-1 rounded bg-emerald-700 text-white text-xs">Attivo</span>}</td>
                    <td className="px-4 py-3">
                      <Button
                        onClick={() => deleteUser(user.id)}
                        className="bg-red-600 hover:bg-red-700 text-xs px-2 py-1"
                      >
                        Elimina
                      </Button>
                      <Button
                        onClick={() => suspendUser(user.id, !user.suspended)}
                        className={`ml-2 text-xs px-2 py-1 ${user.suspended ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}
                      >
                        {user.suspended ? 'Riattiva' : 'Sospendi'}
                      </Button>
                      {user.hasEscortProfile && (
                        <Button
                          onClick={() => router.push(`/dashboard/admin/escort/${user.id}`)}
                          className="ml-2 text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700"
                        >
                          Gestisci escort
                        </Button>
                      )}
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
