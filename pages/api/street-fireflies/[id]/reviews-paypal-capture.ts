import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_ENV = (process.env.PAYPAL_ENV || '').toLowerCase();
const PAYPAL_BASE_URL = PAYPAL_ENV === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal non configurato');
  }
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await response.json();
  if (!response.ok) {
    console.error('PayPal token error', data);
    throw new Error('Impossibile ottenere token PayPal');
  }
  return data.access_token as string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const auth = req.headers.authorization?.replace('Bearer ', '') || '';
    const payload = verifyToken(auth);
    if (!payload) return res.status(401).json({ error: 'Non autorizzato' });

    const { orderId } = req.body || {};
    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({ error: 'Order ID mancante' });
    }

    const order = await prisma.creditOrder.findFirst({
      where: {
        userId: payload.userId,
        status: 'PENDING',
        meta: {
          path: ['paypalOrderId'],
          equals: orderId,
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Ordine non trovato' });
    }

    const meta: any = order.meta || {};
    if (meta.kind !== 'street_reviews_access') {
      return res.status(400).json({ error: 'Ordine non valido per questo tipo di accesso' });
    }

    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const paypalData = await response.json();

    if (!response.ok || paypalData.status !== 'COMPLETED') {
      console.error('PayPal capture failed', paypalData);
      return res.status(400).json({ error: 'Pagamento non completato' });
    }

    await prisma.creditOrder.update({
      where: { id: order.id },
      data: {
        status: 'PAID',
        meta: {
          ...(order.meta as any),
          paypalCaptureId: paypalData.id,
          capturedAt: new Date().toISOString(),
        },
      },
    });

    await prisma.creditTransaction.create({
      data: {
        userId: order.userId,
        amount: 0,
        type: 'PURCHASE',
        reference: `StreetFireflies Reviews Access Order ${orderId}`,
        meta: {
          ...(order.meta as any),
          paypalOrderId: orderId,
          paypalCaptureId: paypalData.id,
        },
      },
    });

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('street-fireflies reviews-paypal-capture error', e);
    return res.status(500).json({ error: 'Errore interno' });
  }
}
