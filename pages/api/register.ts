import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { hashPassword, validateEmail } from '@/lib/auth'

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    .slice(0, 48);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  console.log('🚀 API /api/register chiamata (Pages Router)')
  
  // Controllo variabili d'ambiente critiche
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL mancante!')
    return res.status(500).json({ error: 'Configurazione database mancante' })
  }
  
  if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET mancante!')
    return res.status(500).json({ error: 'Configurazione JWT mancante' })
  }
  
  try {
    const { email, password, ruolo = 'user' } = req.body
    let nome = req.body.nome as string | undefined
    
    console.log('📝 Body ricevuto:', { email, ruolo })

    // Validazione input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e password sono obbligatori' })
    }

    // Validazione email
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Email non valida' })
    }

    // Validazione password minima
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'La password deve essere lunga almeno 6 caratteri' })
    }

    // Nome opzionale: se mancante, derive dall'email
    if (!nome || typeof nome !== 'string' || nome.trim().length === 0) {
      nome = email.split('@')[0]
    }

    // Duplicato?
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(409).json({ error: 'Un utente con questa email esiste già' })
    }

    // Hash
    const hashedPassword = await hashPassword(password)

    // Ruolo consentito - fix per compatibilità
    const allowed = ['user','escort','agency','agenzia']
    const ruoloClean = (typeof ruolo === 'string' ? ruolo.toLowerCase() : 'user')
    // Normalizza 'agency' a 'agenzia' per compatibilità
    const normalizedRole = ruoloClean === 'agency' ? 'agenzia' : ruoloClean
    const finalRole = allowed.includes(normalizedRole) ? normalizedRole : 'user'

    // Crea utente
    const finalNome = String(nome || email.split('@')[0])
    const created = await prisma.user.create({
      data: { nome: finalNome, email, password: hashedPassword, ruolo: finalRole },
      select: { id: true, nome: true, email: true, ruolo: true, createdAt: true }
    })

    // Slug post-create per garantire unicità (nome-k + id)
    const base = slugify(created.nome)
    const uniqueSlug = base ? `${base}-${created.id}` : String(created.id)
    try { 
      await (prisma as any).user.update({ 
        where: { id: created.id }, 
        data: { slug: uniqueSlug } 
      }) 
    } catch {}

    return res.status(201).json({ 
      message: 'Utente registrato con successo', 
      user: created 
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Errore'
    console.error('❌ ERRORE nella registrazione:', error)
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'N/A')
    
    if (message.includes('Unique') || message.includes('P2002')) {
      return res.status(409).json({ error: 'Email già registrata' })
    }
    
    return res.status(500).json({ error: 'Errore interno del server' })
  }
}
