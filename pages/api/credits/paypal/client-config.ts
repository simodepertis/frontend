import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Prova prima la variabile pubblica, altrimenti usa quella server side
  const clientId = (process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID || '').trim()

  if (!clientId) {
    return res.status(500).json({ error: 'PayPal clientId non configurato' })
  }

  return res.status(200).json({ clientId })
}
