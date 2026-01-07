import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { hashPassword, validateEmail } from '@/lib/auth'
import { generateOpaqueToken, getAppUrl, sendEmail, sha256Hex } from '@/lib/resend'

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

    // Ruoli consentiti e normalizzazione (salva SEMPRE 'agency' per agenzia)
    const allowed = ['user','escort','agency','admin','agenzia']
    const ruoloClean = (typeof ruolo === 'string' ? ruolo.toLowerCase() : 'user')
    let normalizedRole = ruoloClean
    if (ruoloClean === 'agenzia') normalizedRole = 'agency'
    if (ruoloClean === 'agency') normalizedRole = 'agency'
    const finalRole = allowed.includes(normalizedRole) ? normalizedRole : 'user'

    // Crea utente
    const finalNome = String(nome || email.split('@')[0])
    const created = await prisma.user.create({
      data: { nome: finalNome, email, password: hashedPassword, ruolo: finalRole },
      select: { id: true, nome: true, email: true, ruolo: true, createdAt: true }
    })

    const adminTo = (process.env.ADMIN_NOTIFICATIONS_EMAIL || '').trim()
    if (adminTo) {
      try {
        await sendEmail({
          to: adminTo,
          subject: 'Nuova registrazione utente',
          html: `
            <p>Nuova registrazione completata:</p>
            <ul>
              <li><strong>ID</strong>: ${created.id}</li>
              <li><strong>Email</strong>: ${created.email}</li>
              <li><strong>Nome</strong>: ${created.nome}</li>
              <li><strong>Ruolo</strong>: ${created.ruolo}</li>
            </ul>
          `,
        })
      } catch (e) {
        console.error('Errore invio email admin (registrazione):', e)
      }
    }

    const hasEmailVerificationTokenModel = !!(prisma as any)?.emailVerificationToken?.create
    if (hasEmailVerificationTokenModel) {
      const rawToken = generateOpaqueToken()
      const tokenHash = sha256Hex(rawToken)
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24)
      await (prisma as any).emailVerificationToken.create({
        data: {
          userId: created.id,
          tokenHash,
          expiresAt,
        },
      })

      const appUrl = getAppUrl() || 'http://localhost:3000'
      const verifyUrl = `${appUrl}/verify-email?token=${encodeURIComponent(rawToken)}`
      await sendEmail({
        to: created.email,
        subject: 'Conferma la tua email',
        html: `
          <p>Ciao ${created.nome},</p>
          <p>Per completare la registrazione, conferma la tua email cliccando qui:</p>
          <p><a href="${verifyUrl}">${verifyUrl}</a></p>
          <p>Se non sei stato tu, ignora questa email.</p>
        `,
      })
    }

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
      message: hasEmailVerificationTokenModel
        ? 'Registrazione completata. Controlla la tua email per confermare l’account.'
        : 'Registrazione completata. (Verifica email non disponibile in questo ambiente)',
      user: created,
      verificationRequired: hasEmailVerificationTokenModel,
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
