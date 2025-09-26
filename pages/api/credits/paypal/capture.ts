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
  try {
    const { orderId, localOrderId } = req.query
    const ppOrderId = String(orderId || '')
    const localId = Number(localOrderId || 0)
    if (!ppOrderId || !localId) return res.status(400).send('Parametri mancanti')

    const order = await prisma.creditOrder.findUnique({ where: { id: localId } })
    if (!order) return res.status(404).send('Ordine non trovato')
    if (order.status === 'PAID') {
      // già processato, reindirizza alla pagina crediti
      return res.redirect(302, '/dashboard/crediti?paid=1')
    }

    const { token, base } = await getPayPalAccessToken()
    const cap = await fetch(base + `/v2/checkout/orders/${encodeURIComponent(ppOrderId)}/capture`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    })

    if (!cap.ok) {
      const txt = await cap.text()
      console.error('PayPal capture error', txt)
      return res.redirect(302, '/dashboard/crediti?error=paypal_capture')
    }

    // Segna ordine pagato e aggiunge crediti al wallet
    await prisma.$transaction(async (tx) => {
      await tx.creditOrder.update({ where: { id: localId }, data: { status: 'PAID' } })

      const wallet = await tx.creditWallet.upsert({
        where: { userId: order.userId },
        update: { balance: { increment: order.credits } },
        create: { userId: order.userId, balance: order.credits }
      })

      await tx.creditTransaction.create({
        data: {
          userId: order.userId,
          amount: order.credits,
          type: 'PURCHASE',
          reference: `paypal:${ppOrderId}`,
          meta: { localOrderId: order.id }
        }
      })
    })

    return res.redirect(302, '/dashboard/crediti?paid=1')
  } catch (e) {
    console.error('❌ /api/credits/paypal/capture error:', e)
    return res.status(500).send('Errore interno')
  }
}
