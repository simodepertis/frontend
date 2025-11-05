import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb', // basta per payload di submit
    },
  },
}

function getUserId(req: NextApiRequest): number | null {
  const auth = req.headers.authorization
  const token = auth?.startsWith('Bearer ') ? auth.substring(7) : (req.cookies as any)['auth-token']
  if (!token) return null
  const payload = verifyToken(token)
  return payload?.userId ?? null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo non consentito' })
  
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Non autenticato' })

  try {
    const { photos, skipValidation } = req.body || {}
    console.log('📨 Submit fotos: user', userId, { hasPhotosArray: Array.isArray(photos), skipValidation: !!skipValidation })
    
    // Se skipValidation, passa tutte le DRAFT a IN_REVIEW
    if (skipValidation) {
      const draftPhotos = await prisma.photo.findMany({ where: { userId, status: 'DRAFT' } })
      console.log('🔎 DRAFT trovate:', draftPhotos.length)
      
      if (draftPhotos.length < 3) {
        return res.status(400).json({ error: 'Devi caricare almeno 3 foto in bozza (DRAFT) prima di inviare' })
      }
      
      const faceCount = draftPhotos.filter(p => p.isFace).length
      console.log('🔎 Volti marcati nelle DRAFT:', faceCount)
      if (faceCount < 1) {
        return res.status(400).json({ error: 'Almeno una foto DRAFT deve essere marcata come volto' })
      }

      const upd = await prisma.photo.updateMany({
        where: { userId, status: 'DRAFT' },
        data: { status: 'IN_REVIEW' }
      })
      console.log('✅ Aggiornate a IN_REVIEW:', upd.count)
      return res.status(200).json({ ok: true, message: 'Foto inviate in revisione' })
    }
    
    // Altrimenti, modalità batch (crea foto da array)
    if (!photos || !Array.isArray(photos)) {
      return res.status(400).json({ error: 'Array foto mancante' })
    }
    
    if (photos.length < 3) {
      return res.status(400).json({ error: 'Devi caricare almeno 3 foto' })
    }
    
    const faceCount = photos.filter((p: any) => p.isFace).length
    if (faceCount < 1) {
      return res.status(400).json({ error: 'Almeno una foto deve essere marcata come volto' })
    }

    // Crea tutte le foto nel DB come IN_REVIEW
    const created = await prisma.photo.createMany({
      data: photos.map((p: any) => ({
        userId,
        url: p.url,
        name: p.name,
        size: p.size || 0,
        status: 'IN_REVIEW',
        isFace: !!p.isFace,
      }))
    })
    console.log('✅ createMany photos IN_REVIEW:', created.count)
    return res.status(200).json({ ok: true, message: 'Foto inviate in revisione' })
  } catch (err: any) {
    console.error('❌ API /api/escort/photos/submit errore:', err?.message || err)
    const msg = err?.message || 'Errore interno'
    return res.status(500).json({ error: msg })
  }
}
