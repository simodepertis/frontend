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
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`PayPal token error (HTTP ${res.status}) ${txt}`)
  }
  const json = await res.json() as any
  return { token: json.access_token as string, base }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const tokenHeader = req.headers.authorization?.replace('Bearer ', '')
    const auth = verifyToken(tokenHeader || '')
    if (!auth) return res.status(401).json({ error: 'Non autenticato' })

    const { orderId } = req.body || {}
    if (!orderId) return res.status(400).json({ error: 'Order ID mancante' })

    // Trova ordine PENDING legato a questo utente e orderId PayPal (salvato in meta.paypalOrderId)
    const order = await prisma.creditOrder.findFirst({
      where: {
        userId: auth.userId,
        status: 'PENDING',
        meta: {
          path: ['paypalOrderId'],
          equals: orderId,
        } as any,
      },
    })

    if (!order) return res.status(404).json({ error: 'Ordine non trovato' })

    const { token, base } = await getPayPalAccessToken()
    const cap = await fetch(base + `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const paypalData = await cap.json() as any

    if (!cap.ok || paypalData.status !== 'COMPLETED') {
      console.error('PayPal capture failed:', paypalData)
      return res.status(400).json({
        error: 'Pagamento non completato',
        details: paypalData,
      })
    }

    // Aggiorna ordine + wallet + transazione
    const newBalance = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.creditOrder.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          meta: {
            ...(order.meta as any),
            paypalCaptureId: paypalData.id,
            capturedAt: new Date().toISOString(),
          },
        },
      })

      const wallet = await tx.creditWallet.upsert({
        where: { userId: auth.userId },
        update: { balance: { increment: updatedOrder.credits } },
        create: { userId: auth.userId, balance: updatedOrder.credits },
      })

      await tx.creditTransaction.create({
        data: {
          userId: auth.userId,
          amount: updatedOrder.credits,
          type: 'PURCHASE',
          reference: `paypal:${orderId}`,
          meta: { localOrderId: updatedOrder.id },
        },
      })

      return wallet.balance
    })

    return res.status(200).json({ ok: true, newBalance })
  } catch (e) {
    console.error('❌ /api/credits/paypal/capture-order error:', e)
    return res.status(500).json({ error: 'Errore interno', details: (e as any)?.message || String(e) })
  }
}
