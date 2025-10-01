import type { NextApiRequest, NextApiResponse } from 'next'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🔧 Iniziando migrazione database...')
    
    // Esegui prisma db push per creare tabelle mancanti
    const { stdout, stderr } = await execAsync('npx prisma db push --accept-data-loss')
    
    console.log('✅ Migrazione completata!')
    console.log('STDOUT:', stdout)
    if (stderr) console.log('STDERR:', stderr)

    return res.json({ 
      success: true,
      message: 'Database migration completed successfully',
      stdout,
      stderr: stderr || null
    })

  } catch (error: any) {
    console.error('❌ Errore migrazione database:', error)
    return res.status(500).json({ 
      success: false,
      error: 'Database migration failed',
      details: error.message,
      stdout: error.stdout || null,
      stderr: error.stderr || null
    })
  }
}
