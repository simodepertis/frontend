"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const token = localStorage.getItem('auth-token');
        if (!token) {
          console.log('❌ Nessun token - reindirizzamento a login');
          router.push('/autenticazione');
          return;
        }

        const res = await fetch('/api/user/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          console.log('❌ Token non valido - reindirizzamento a login');
          router.push('/autenticazione');
          return;
        }

        const data = await res.json();
        const userRole = data?.user?.ruolo;
        
        console.log('👤 Controllo accesso admin - Ruolo utente:', userRole);

        if (userRole !== 'admin') {
          console.log('🚫 Accesso negato - non admin');
          alert('🚫 Accesso negato: solo gli amministratori possono accedere a questa sezione.');
          router.push('/dashboard');
          return;
        }

        console.log('✅ Accesso admin autorizzato');
        setIsAuthorized(true);
      } catch (error) {
        console.error('❌ Errore verifica admin:', error);
        router.push('/autenticazione');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Verifica autorizzazioni...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">🚫 Accesso Negato</h1>
          <p className="text-gray-400">Solo gli amministratori possono accedere a questa sezione.</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            Torna alla Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
