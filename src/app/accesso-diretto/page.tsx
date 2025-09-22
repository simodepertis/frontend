"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function AccessoDiretto() {
  const [email, setEmail] = useState("");

  const handleAccess = () => {
    if (!email) {
      alert('Inserisci una email');
      return;
    }
    
    // Salva nel localStorage
    localStorage.setItem('auth-token', 'direct-access-' + Date.now());
    localStorage.setItem('user-email', email);
    localStorage.setItem('user-name', email.split('@')[0]);
    localStorage.setItem('user-role', 'admin');
    
    // Vai alla dashboard
    window.location.href = '/dashboard';
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6 text-center">🚀 ACCESSO DIRETTO</h1>
        <p className="text-gray-300 mb-6 text-center">
          Bypassa il login e accedi direttamente alla dashboard
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="inserisci@email.com"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
            />
          </div>
          
          <Button 
            onClick={handleAccess}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
          >
            🎯 ACCEDI ALLA DASHBOARD
          </Button>
        </div>
        
        <div className="mt-6 p-4 bg-gray-700 rounded">
          <h3 className="font-bold mb-2">📋 Come funziona:</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>✅ Inserisci una email qualsiasi</li>
            <li>✅ Clicca il pulsante</li>
            <li>✅ Sarai nella dashboard immediatamente</li>
            <li>✅ Nessun login complicato</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
