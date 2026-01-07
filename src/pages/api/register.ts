import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { hashPassword, validateEmail, validatePassword } from '@/lib/auth'
import { generateOpaqueToken, getAppUrl, sendEmail, sha256Hex } from '@/lib/resend'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo non consentito' })
  try {
    const { email, password, nome, ruolo } = req.body || {}

    if (!email || !password || !nome) {
      return res.status(400).json({ error: 'Dati mancanti' })
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Email non valida' })
    }
    const pw = validatePassword(password)
    if (!pw.isValid) {
      return res.status(400).json({ error: pw.errors.join(' • ') })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ error: 'Email già registrata' })
    }

    const hashed = await hashPassword(password)
    const created = await prisma.user.create({
      data: {
        email,
        password: hashed,
        nome: nome || 'Utente',
        ruolo: ruolo === 'escort' || ruolo === 'agency' || ruolo === 'admin' ? ruolo : 'user',
      }
    })

    const rawToken = generateOpaqueToken()
    const tokenHash = sha256Hex(rawToken)
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24)
    await (prisma as any).emailVerificationToken.create({
      data: { userId: created.id, tokenHash, expiresAt }
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

    return res.status(201).json({
      message: 'Registrazione completata. Controlla la tua email per confermare l’account.',
      user: { id: created.id, email: created.email, nome: created.nome, ruolo: created.ruolo },
      verificationRequired: true,
    })
  } catch (err) {
    console.error('Errore /api/register:', err)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
