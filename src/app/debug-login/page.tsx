"use client";

import { useState } from "react";

export default function DebugLogin() {
  const [logs, setLogs] = useState<string[]>([]);
  const [email, setEmail] = useState("test@test.com");
  const [password, setPassword] = useState("password123");

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testLogin = async () => {
    addLog("🚀 INIZIO TEST LOGIN");
    
    try {
      addLog("📡 Chiamando API /api/login...");
      
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      addLog(`📡 Risposta API: ${res.status} ${res.statusText}`);
      
      if (!res.ok) {
        const errorText = await res.text();
        addLog(`❌ Errore API: ${errorText}`);
        return;
      }
      
      const data = await res.json();
      addLog(`✅ Dati ricevuti: ${JSON.stringify(data)}`);
      
      // Salva nel localStorage
      if (data.token) {
        localStorage.setItem('auth-token', data.token);
        addLog("💾 Token salvato nel localStorage");
      }
      
      if (data.user) {
        localStorage.setItem('user-email', data.user.email);
        localStorage.setItem('user-name', data.user.nome);
        addLog(`💾 Dati utente salvati: ${data.user.nome}`);
      }
      
      addLog("🔄 Tentativo redirect...");
      
      // Test redirect
      setTimeout(() => {
        addLog("🎯 Eseguendo window.location.href = '/dashboard'");
        window.location.href = '/dashboard';
      }, 2000);
      
    } catch (error) {
      addLog(`💥 ERRORE: ${error}`);
    }
  };

  const testRedirectDiretto = () => {
    addLog("🎯 Test redirect diretto...");
    window.location.href = '/dashboard';
  };

  const clearLogs = () => setLogs([]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">🔧 DEBUG LOGIN</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CONTROLLI */}
        <div className="space-y-4">
          <div>
            <label className="block mb-2">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
            />
          </div>
          
          <div>
            <label className="block mb-2">Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
            />
          </div>
          
          <div className="space-y-2">
            <button
              onClick={testLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold"
            >
              🧪 TEST LOGIN COMPLETO
            </button>
            
            <button
              onClick={testRedirectDiretto}
              className="w-full bg-green-600 hover:bg-green-700 p-3 rounded font-bold"
            >
              🎯 TEST REDIRECT DIRETTO
            </button>
            
            <button
              onClick={clearLogs}
              className="w-full bg-gray-600 hover:bg-gray-700 p-3 rounded"
            >
              🧹 PULISCI LOGS
            </button>
          </div>
        </div>
        
        {/* LOGS */}
        <div>
          <h2 className="text-xl font-bold mb-4">📋 LOGS DEBUG:</h2>
          <div className="bg-black p-4 rounded h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-500">Nessun log ancora...</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="mb-1">{log}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
