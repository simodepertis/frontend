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

    const idParam = req.query.id;
    if (!idParam || Array.isArray(idParam)) return res.status(400).json({ error: 'ID non valido' });
    const streetEscortId = parseInt(idParam, 10);
    if (!Number.isFinite(streetEscortId)) return res.status(400).json({ error: 'ID non valido' });

    const amount = '1.00';

    const order = await prisma.creditOrder.create({
      data: {
        userId: payload.userId,
        credits: 0,
        method: 'paypal_street_reviews',
        status: 'PENDING',
        meta: {
          kind: 'street_reviews_access',
          streetEscortId,
          totalAmount: amount,
        },
      },
    });

    const accessToken = await getPayPalAccessToken();

    const paypalOrder = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: order.id.toString(),
          amount: {
            currency_code: 'EUR',
            value: amount,
          },
          description: `Accesso recensioni Street Fireflies profilo #${streetEscortId}`,
        },
      ],
    };

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(paypalOrder),
    });

    const paypalData = await response.json();

    if (!response.ok) {
      console.error('PayPal order creation failed', paypalData);
      return res.status(500).json({ error: 'Errore creazione ordine PayPal' });
    }

    await prisma.creditOrder.update({
      where: { id: order.id },
      data: {
        meta: {
          ...(order.meta as any),
          paypalOrderId: paypalData.id,
        },
      },
    });

    return res.status(200).json({
      orderId: paypalData.id,
      dbOrderId: order.id,
    });
  } catch (e) {
    console.error('street-fireflies reviews-paypal-create error', e);
    return res.status(500).json({ error: 'Errore interno' });
  }
}
