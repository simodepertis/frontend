import { createHash, randomBytes } from 'crypto'

function requireEnv(name: string): string {
  const v = (process.env[name] || '').trim()
  if (!v) throw new Error(`${name} mancante`)
  return v
}

export function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

export function generateOpaqueToken(): string {
  return randomBytes(32).toString('hex')
}

export function getAppUrl(): string {
  const raw = (process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || '').trim()
  return raw.replace(/\/+$/, '')
}

export function getEmailVerificationCutoff(): Date | null {
  const raw = (process.env.EMAIL_VERIFICATION_CUTOFF || '').trim()
  if (!raw) return null
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return null
  return d
}

export function shouldRequireEmailVerification(createdAt: Date): boolean {
  const cutoff = getEmailVerificationCutoff()
  if (!cutoff) return true
  return createdAt.getTime() >= cutoff.getTime()
}

export async function sendEmail(params: { to: string; subject: string; html: string }): Promise<void> {
  const apiKey = requireEnv('RESEND_API_KEY')
  const from = requireEnv('EMAIL_FROM')

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Invio email fallito: ${res.status} ${text}`)
  }
}
