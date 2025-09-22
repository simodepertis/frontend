import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  console.log('🚪 API /api/logout chiamata')
  
  try {
    // Rimuovi cookie se esistono
    res.setHeader('Set-Cookie', [
      'auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly',
      'user-session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly'
    ])
    
    console.log('✅ Logout completato - cookie rimossi')
    
    return res.status(200).json({ 
      message: 'Logout completato con successo' 
    })
  } catch (error: unknown) {
    console.error('❌ ERRORE nel logout:', error)
    return res.status(500).json({ error: 'Errore interno del server' })
  }
}
