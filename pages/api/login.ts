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
    const { email, password } = req.body
    console.log('📧 Email ricevuta:', email)

    // Validazione input
    if (!email || !password) {
      console.log('❌ Email o password mancanti')
      return res.status(400).json({ error: 'Email e password sono obbligatori' })
    }

    // LOGIN SEMPLIFICATO - ACCETTA QUALSIASI CREDENZIALE
    if (email && password && password.length >= 6) {
      console.log('✅ Login semplificato accettato per:', email)
      
      // SOLO simodepertis@gmail.com è admin, tutti gli altri sono user
      const isAdmin = email.toLowerCase() === 'simodepertis@gmail.com'
      
      const fakeUser = {
        id: 1,
        nome: email.split('@')[0],
        email: email,
        ruolo: isAdmin ? 'admin' : 'user'
      }
      
      console.log(`👤 Ruolo assegnato a ${email}: ${fakeUser.ruolo}`)
      
      const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'
      const token = jwt.sign({ userId: fakeUser.id, email: fakeUser.email }, JWT_SECRET, { expiresIn: '7d' })
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
        user: fakeUser,
        token: token
      })
    }

    return res.status(401).json({ error: 'Password troppo corta' })
  } catch (error: unknown) {
    console.error('❌ ERRORE nel login:', error)
    return res.status(500).json({ error: 'Errore interno del server' })
  }
}
