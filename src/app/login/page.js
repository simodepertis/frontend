"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      
      if (!res.ok) {
        const errorData = await res.text();
        throw new Error("Credenziali non valide");
      }
      
      const data = await res.json();
      setMessage(data.message);
      
      // Salva i dati utente
      if (data.token) {
        localStorage.setItem('auth-token', data.token);
      }
      if (data.user) {
        localStorage.setItem('user-email', data.user.email);
        localStorage.setItem('user-name', data.user.nome);
        localStorage.setItem('user-role', data.user.ruolo);
      }
      
      // Redirect alla dashboard
      router.push('/dashboard');
    } catch (error) {
      setMessage("Errore: " + error.message);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Accedi</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        /><br/><br/>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        /><br/><br/>
        <button type="submit">Accedi</button>
      </form>
      <p>{message}</p>
    </div>
  );
}
