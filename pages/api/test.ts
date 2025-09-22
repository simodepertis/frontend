import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('🧪 Test API chiamata (Pages Router)')
  
  if (req.method === 'GET') {
    return res.status(200).json({ 
      message: 'Test API funziona! (Pages Router)', 
      timestamp: new Date().toISOString(),
      method: 'GET'
    })
  }
  
  if (req.method === 'POST') {
    return res.status(200).json({ 
      message: 'Test POST funziona! (Pages Router)', 
      timestamp: new Date().toISOString(),
      method: 'POST'
    })
  }
  
  return res.status(405).json({ error: 'Method not allowed' })
}
