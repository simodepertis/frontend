"use client";

import SectionHeader from "@/components/SectionHeader";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faUsers, 
  faImages, 
  faVideo, 
  faBolt, 
  faExclamationTriangle,
  faCheckCircle,
  faClockRotateLeft
} from "@fortawesome/free-solid-svg-icons";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingPhotos: 0,
    pendingVideos: 0,
    pendingOrders: 0,
    pendingProfiles: 0,
    totalCreditsOrdered: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const token = localStorage.getItem('auth-token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Simulated stats - in production these would come from real APIs
      setStats({
        totalUsers: 150,
        pendingPhotos: 12,
        pendingVideos: 3,
        pendingOrders: 5,
        pendingProfiles: 8,
        totalCreditsOrdered: 2500
      });
      
    } catch (error) {
      console.error('❌ Errore caricamento statistiche admin:', error);
    } finally {
      setLoading(false);
    }
  }

  const StatCard = ({ title, value, icon, color, href }: any) => (
    <div className={`bg-gray-800 rounded-lg p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <FontAwesomeIcon icon={icon} className="text-3xl text-gray-500" />
      </div>
      {href && (
        <a href={href} className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block">
          Gestisci →
        </a>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <SectionHeader 
        title="🏠 Dashboard Amministratore" 
        subtitle="Panoramica generale del sito e delle attività da moderare" 
      />

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Caricamento statistiche...</p>
        </div>
      ) : (
        <>
          {/* Statistiche Generali */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              title="Utenti Totali"
              value={stats.totalUsers}
              icon={faUsers}
              color="border-blue-500"
              href="/dashboard/admin/utenti"
            />
            <StatCard
              title="Crediti Ordinati"
              value={stats.totalCreditsOrdered}
              icon={faBolt}
              color="border-green-500"
              href="/dashboard/admin/crediti/ordini"
            />
            <StatCard
              title="Profili in Attesa"
              value={stats.pendingProfiles}
              icon={faClockRotateLeft}
              color="border-yellow-500"
              href="/dashboard/admin/profili"
            />
          </div>

          {/* Attività da Moderare */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-500" />
              Attività in Attesa di Moderazione
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <FontAwesomeIcon icon={faImages} className="text-2xl text-blue-400 mb-2" />
                <p className="text-lg font-bold text-white">{stats.pendingPhotos}</p>
                <p className="text-sm text-gray-400">Foto da Approvare</p>
                <a href="/dashboard/admin/media/foto" className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block">
                  Modera →
                </a>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <FontAwesomeIcon icon={faVideo} className="text-2xl text-purple-400 mb-2" />
                <p className="text-lg font-bold text-white">{stats.pendingVideos}</p>
                <p className="text-sm text-gray-400">Video da Approvare</p>
                <a href="/dashboard/admin/media/video" className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block">
                  Modera →
                </a>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <FontAwesomeIcon icon={faBolt} className="text-2xl text-green-400 mb-2" />
                <p className="text-lg font-bold text-white">{stats.pendingOrders}</p>
                <p className="text-sm text-gray-400">Ordini da Approvare</p>
                <a href="/dashboard/admin/crediti/ordini" className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block">
                  Approva →
                </a>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <FontAwesomeIcon icon={faUsers} className="text-2xl text-orange-400 mb-2" />
                <p className="text-lg font-bold text-white">{stats.pendingProfiles}</p>
                <p className="text-sm text-gray-400">Profili da Verificare</p>
                <a href="/dashboard/admin/profili" className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block">
                  Verifica →
                </a>
              </div>
            </div>
          </div>

          {/* Azioni Rapide */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />
              Azioni Rapide
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <a href="/dashboard/admin/crediti/catalogo" className="bg-blue-600 hover:bg-blue-700 rounded-lg p-4 text-center transition-colors">
                <FontAwesomeIcon icon={faBolt} className="text-2xl text-white mb-2" />
                <p className="text-white font-semibold">Gestisci Catalogo Crediti</p>
              </a>
              
              <a href="/dashboard/admin/utenti" className="bg-purple-600 hover:bg-purple-700 rounded-lg p-4 text-center transition-colors">
                <FontAwesomeIcon icon={faUsers} className="text-2xl text-white mb-2" />
                <p className="text-white font-semibold">Gestisci Utenti</p>
              </a>
              
              <a href="/dashboard/admin/statistiche" className="bg-green-600 hover:bg-green-700 rounded-lg p-4 text-center transition-colors">
                <FontAwesomeIcon icon={faUsers} className="text-2xl text-white mb-2" />
                <p className="text-white font-semibold">Statistiche Dettagliate</p>
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
