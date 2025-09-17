// test-auth.js
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api'; // indirizzo del tuo server Next.js

// Funzione per registrare un utente
async function register(username, password) {
  const response = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  console.log('Registrazione:', data);
  return data;
}

// Funzione per fare login
async function login(username, password) {
  const response = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  console.log('Login:', data);
  return data;
}

// Esempio di utilizzo
(async () => {
  const username = 'gabriele';
  const password = 'Password123!';

  console.log('--- Registrazione ---');
  await register(username, password);

  console.log('--- Login ---');
  await login(username, password);
})();
