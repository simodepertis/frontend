import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID as string
  const secret = process.env.PAYPAL_SECRET as string
  const env = (process.env.PAYPAL_ENV || 'sandbox').toLowerCase()
  if (!clientId || !secret) throw new Error('PAYPAL_CLIENT_ID or PAYPAL_SECRET missing')
  const base = env === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'
  const res = await fetch(base + '/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(clientId + ':' + secret).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })
  if (!res.ok) throw new Error('PayPal token error')
  const json = await res.json() as any
  return { token: json.access_token as string, base }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { orderId } = req.query as { orderId?: string }
    if (!orderId) return res.status(400).send('orderId mancante')

    const { token, base } = await getPayPalAccessToken()
    // Cattura pagamento
    const cap = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (!cap.ok) {
      const t = await cap.text()
      console.error('PayPal capture error', t)
      return res.redirect(302, '/dashboard/annunci?error=paypal_capture')
    }
    const capJson = await cap.json() as any

    // Ricaviamo lo userId dal reference_id se presente: ANNUNCI-<userId>-<ts>
    const ref = capJson?.purchase_units?.[0]?.reference_id || ''
    const match = ref.match(/^ANNUNCI-(\d+)-/)
    const userId = match ? Number(match[1]) : null

    if (userId) {
      // Segna accesso attivo in escortProfile.contacts.addons.apartmentAds = true (senza migrazioni di schema)
      const prof = await prisma.escortProfile.findUnique({ where: { userId } })
      const contacts = (prof?.contacts as any) || {}
      const nextContacts = { ...contacts, addons: { ...(contacts.addons||{}), apartmentAds: true, apartmentAdsAt: new Date().toISOString() } }
      await prisma.escortProfile.upsert({
        where: { userId },
        update: { contacts: nextContacts as any },
        create: { userId, contacts: nextContacts as any }
      })
    }

    return res.redirect(302, '/dashboard/annunci?unlocked=1')
  } catch (e) {
    console.error('❌ /api/annunci/paypal/capture error:', e)
    return res.redirect(302, '/dashboard/annunci?error=1')
  }
}
