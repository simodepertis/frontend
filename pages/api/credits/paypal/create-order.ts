import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID as string
  const secret = (process.env.PAYPAL_SECRET || process.env.PAYPAL_CLIENT_SECRET) as string
  const env = (process.env.PAYPAL_ENV || 'sandbox').toLowerCase()
  if (!clientId || !secret) throw new Error('PAYPAL_CLIENT_ID or PAYPAL_SECRET / PAYPAL_CLIENT_SECRET missing')
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

    const { credits } = req.body || {}
    const qty = Number(credits || 0)
    if (!Number.isFinite(qty) || qty < 10) return res.status(400).json({ error: 'Minimo 10 crediti' })

    // Prezzo per credito da AdminSettings
    const settings = await prisma.adminSettings.findFirst()
    const creditValueCents = settings?.creditValueCents ?? 100 // default 1.00 EUR
    const totalCents = qty * creditValueCents
    const total = (totalCents / 100).toFixed(2)

    // Crea ordine interno PENDING
    const order = await prisma.creditOrder.create({
      data: {
        userId: auth.userId,
        credits: qty,
        method: 'paypal',
        status: 'PENDING',
      }
    })

    // Crea ordine su PayPal
    const { token, base } = await getPayPalAccessToken()
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
            reference_id: String(order.id),
            amount: { currency_code: 'EUR', value: total },
            description: `${qty} crediti`
          }
        ],
        application_context: {
          brand_name: 'IncontriEscort',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
          return_url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/credits/paypal/capture?orderId={orderID}&localOrderId=${order.id}`,
          cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/dashboard/crediti?cancel=1`
        }
      })
    })
    if (!ppRes.ok) {
      const txt = await ppRes.text()
      console.error('PayPal create order error', txt)
      return res.status(500).json({ error: 'Errore creazione ordine PayPal' })
    }
    const data = await ppRes.json() as any

    // Salva l'ID ordine PayPal in meta.paypalOrderId per il successivo capture-order
    await prisma.creditOrder.update({
      where: { id: order.id },
      data: {
        meta: {
          ...(order as any).meta,
          paypalOrderId: data.id,
        },
      },
    })

    const approvalUrl = (data.links || []).find((l: any) => l.rel === 'approve')?.href

    return res.status(200).json({ ok: true, orderId: data.id, approvalUrl, localOrderId: order.id, total })
  } catch (e) {
    console.error('❌ /api/credits/paypal/create-order error:', e)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
