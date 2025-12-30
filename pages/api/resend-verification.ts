import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { generateOpaqueToken, getAppUrl, sendEmail, sha256Hex } from '@/lib/resend'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const email = String((req.body?.email || '') as string).toLowerCase().trim()
    if (!email) return res.status(400).json({ error: 'Email mancante' })

    const user = await (prisma as any).user.findUnique({
      where: { email },
      select: { id: true, nome: true, email: true, createdAt: true, emailVerifiedAt: true },
    })

    if (!user) return res.status(200).json({ ok: true })
    if (user.emailVerifiedAt) return res.status(200).json({ ok: true })

    await (prisma as any).emailVerificationToken.deleteMany({ where: { userId: user.id } }).catch(() => {})

    const rawToken = generateOpaqueToken()
    const tokenHash = sha256Hex(rawToken)
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24)

    await (prisma as any).emailVerificationToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    })

    const appUrl = getAppUrl() || 'http://localhost:3000'
    const verifyUrl = `${appUrl}/verify-email?token=${encodeURIComponent(rawToken)}`

    await sendEmail({
      to: user.email,
      subject: 'Conferma la tua email',
      html: `
        <p>Ciao ${user.nome},</p>
        <p>Per completare la registrazione, conferma la tua email cliccando qui:</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p>Se non sei stato tu, ignora questa email.</p>
      `,
    })

    return res.status(200).json({ ok: true })
  } catch (error: unknown) {
    console.error('❌ ERRORE resend-verification:', error)
    return res.status(500).json({ error: 'Errore interno del server' })
  }
}
