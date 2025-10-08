import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const clientId = process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
    if (!clientId) {
      return res.status(500).json({ error: 'PayPal clientId non configurato' });
    }
    return res.json({ clientId, currency: 'EUR' });
  } catch (e) {
    return res.status(500).json({ error: 'Errore interno' });
  }
}
