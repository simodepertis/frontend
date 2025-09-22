import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  console.log('🔐 API /api/login chiamata')
  
  try {
    const { email, password, expectedRole } = req.body
    console.log('📧 Email ricevuta:', email)
    console.log('🎭 Ruolo atteso:', expectedRole)

    // Validazione input
    if (!email || !password) {
      console.log('❌ Email o password mancanti')
      return res.status(400).json({ error: 'Email e password sono obbligatori' })
    }

    // CERCA UTENTE NEL DATABASE
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { 
        id: true, 
        nome: true, 
        email: true, 
        password: true,
        ruolo: true 
      }
    })

    if (!user) {
      console.log('❌ Utente non trovato:', email)
      return res.status(401).json({ error: 'Email o password non corretti' })
    }

    // VERIFICA PASSWORD (per ora accetta qualsiasi password >= 6 caratteri)
    if (password.length < 6) {
      console.log('❌ Password troppo corta')
      return res.status(401).json({ error: 'Email o password non corretti' })
    }

    // VERIFICA RUOLO - L'utente può accedere solo con il ruolo corretto
    // MAPPING SPECIALE: admin può accedere da tab "agenzia"
    const allowedAccess = expectedRole && (
      user.ruolo === expectedRole || 
      (user.ruolo === 'admin' && expectedRole === 'agenzia')
    );
    
    if (expectedRole && !allowedAccess) {
      console.log(`❌ Ruolo non corrispondente. Utente: ${user.ruolo}, Atteso: ${expectedRole}`)
      const correctTab = user.ruolo === 'admin' ? 'Agenzia' : user.ruolo;
      return res.status(403).json({ 
        error: `Questo account è registrato come "${user.ruolo}". Seleziona la scheda "${correctTab}" per accedere.` 
      })
    }

    console.log('✅ Login accettato per:', email)
    console.log(`👤 Ruolo utente: ${user.ruolo}`)
      
      const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })
      // Imposta cookie httpOnly per la middleware (richiesto per accedere a /dashboard)
      const isProd = process.env.NODE_ENV === 'production'
      const cookieParts = [
        `auth-token=${token}`,
        'Path=/',
        'HttpOnly',
        'SameSite=Lax',
        // In produzione il cookie deve essere Secure per HTTPS
        isProd ? 'Secure' : '' ,
        // durata 7 giorni
        'Max-Age=604800'
      ].filter(Boolean)
      
      try {
        res.setHeader('Set-Cookie', cookieParts.join('; '))
        console.log('🍪 Cookie impostato correttamente')
      } catch (e) {
        console.log('⚠️ Impossibile impostare cookie:', e)
      }
      
      // Headers CORS per Render
      res.setHeader('Access-Control-Allow-Credentials', 'true')
      res.setHeader('Access-Control-Allow-Origin', isProd ? 'https://frontend-5-7ljh.onrender.com' : 'http://localhost:3000')
      
      return res.status(200).json({
        message: 'Login effettuato con successo',
        user: user,
        token: token
      })
  } catch (error: unknown) {
    console.error('❌ ERRORE nel login:', error)
    return res.status(500).json({ error: 'Errore interno del server' })
  }
}
