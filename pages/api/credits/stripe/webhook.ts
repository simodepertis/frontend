import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export const config = {
  api: {
    bodyParser: false,
  },
}

async function readRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req as any) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const secretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!secretKey) return res.status(500).json({ error: 'STRIPE_SECRET_KEY mancante' })
  if (!webhookSecret) return res.status(500).json({ error: 'STRIPE_WEBHOOK_SECRET mancante' })

  const stripe = new Stripe(secretKey)

  try {
    const sig = req.headers['stripe-signature']
    if (!sig || Array.isArray(sig)) return res.status(400).send('Missing stripe-signature')

    const rawBody = await readRawBody(req)
    const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const sessionId = session.id
      const localOrderId = Number((session.metadata as any)?.localOrderId || session.client_reference_id || 0)

      if (!localOrderId) {
        console.error('Stripe webhook missing localOrderId', { sessionId })
        return res.status(400).send('Missing localOrderId')
      }

      await prisma.$transaction(async (tx) => {
        const order = await tx.creditOrder.findUnique({ where: { id: localOrderId } })
        if (!order) throw new Error('Ordine non trovato')

        // Idempotency: if already paid, do nothing
        if (order.status === 'PAID') return

        const updatedOrder = await tx.creditOrder.update({
          where: { id: localOrderId },
          data: {
            status: 'PAID',
            meta: {
              ...(order.meta as any),
              stripeSessionId: sessionId,
              stripePaymentIntent: session.payment_intent,
              paidAt: new Date().toISOString(),
            },
          },
        })

        const wallet = await tx.creditWallet.upsert({
          where: { userId: updatedOrder.userId },
          update: { balance: { increment: updatedOrder.credits } },
          create: { userId: updatedOrder.userId, balance: updatedOrder.credits },
        })

        await tx.creditTransaction.create({
          data: {
            userId: updatedOrder.userId,
            amount: updatedOrder.credits,
            type: 'PURCHASE',
            reference: `stripe:${sessionId}`,
            meta: { localOrderId: updatedOrder.id },
          },
        })

        return wallet.balance
      })
    }

    return res.status(200).json({ received: true })
  } catch (e: any) {
    console.error('❌ Stripe webhook error:', e)
    return res.status(400).send(`Webhook Error: ${e?.message || String(e)}`)
  }
}
