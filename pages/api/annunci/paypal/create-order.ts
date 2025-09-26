import type { NextApiRequest, NextApiResponse } from 'next'
import { verifyToken } from '@/lib/auth'

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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const tokenHeader = req.headers.authorization?.replace('Bearer ', '')
    const auth = verifyToken(tokenHeader || '')
    if (!auth) return res.status(401).json({ error: 'Non autenticato' })

    const { product } = req.body || {}
    if (product !== 'APARTMENT_AD_ACCESS') return res.status(400).json({ error: 'Prodotto non valido' })

    // Prezzo fisso per accesso annunci appartamenti: 19.00 EUR (personalizzabile via env)
    const amount = Number(process.env.APT_AD_ACCESS_EUR || '19.00').toFixed(2)

    const { token, base } = await getPayPalAccessToken()
    const referenceId = `ANNUNCI-${auth.userId}-${Date.now()}`
    const ppRes = await fetch(base + '/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: referenceId,
            amount: { currency_code: 'EUR', value: amount },
            description: 'Accesso area annunci appartamenti/B&B'
          }
        ],
        application_context: {
          brand_name: 'IncontriEscort',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
          return_url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/annunci/paypal/capture?orderId={orderID}`,
          cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/dashboard/annunci?cancel=1`
        }
      })
    })
    if (!ppRes.ok) {
      const txt = await ppRes.text()
      console.error('PayPal create order error', txt)
      return res.status(500).json({ error: 'Errore creazione ordine PayPal' })
    }
    const data = await ppRes.json() as any
    const approvalUrl = (data.links || []).find((l: any) => l.rel === 'approve')?.href

    return res.status(200).json({ ok: true, orderId: data.id, approvalUrl })
  } catch (e) {
    console.error('❌ /api/annunci/paypal/create-order error:', e)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
