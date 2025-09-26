import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import formidable, { File as FormidableFile } from 'formidable'
import path from 'path'
import fs from 'fs'

export const config = { api: { bodyParser: false } }

async function parseForm(req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files; }> {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  await fs.promises.mkdir(uploadDir, { recursive: true })
  const form = formidable({ multiples: false, uploadDir, keepExtensions: true })
  return await new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err)
      resolve({ fields, files })
    })
  })
}

function getUserIdFromAuth(req: NextApiRequest): number | null {
  const auth = req.headers.authorization || ''
  const raw = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!raw) return null
  const payload = verifyToken(raw)
  return payload?.userId || null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const agencyUserId = getUserIdFromAuth(req)
    if (!agencyUserId) return res.status(401).json({ error: 'Non autenticato' })

    const { fields, files } = await parseForm(req)

    const escortUserId = Number((fields.escortUserId as any) || 0)
    if (!escortUserId) return res.status(400).json({ error: 'escortUserId obbligatorio' })

    const prof = await prisma.escortProfile.findUnique({ where: { userId: escortUserId } })
    if (!prof || prof.agencyId !== agencyUserId) return res.status(403).json({ error: 'Escort non collegata alla tua agenzia' })

    const f = (files.file || files.upload || files.document) as FormidableFile | FormidableFile[] | undefined
    const file = Array.isArray(f) ? f[0] : f
    if (!file) return res.status(400).json({ error: 'File mancante' })

    const mime = (file.mimetype || '').toLowerCase()
    if (!mime.startsWith('image/')) return res.status(400).json({ error: 'Formato non supportato' })
    if ((file.size || 0) > 5 * 1024 * 1024) return res.status(400).json({ error: 'File troppo grande (max 5MB)' })

    const storedBasename = path.basename((file as any).filepath || (file as any).newFilename || file.originalFilename || `doc_${Date.now()}`)
    const url = `/uploads/${storedBasename}`

    const rawField = (fields as any).type
    const rawType = (Array.isArray(rawField) ? String(rawField[0] || '') : String(rawField || '')).toUpperCase()
    const type: any = ['ID_CARD_FRONT','ID_CARD_BACK','SELFIE_WITH_ID'].includes(rawType) ? rawType : 'ID_CARD_FRONT'

    const created = await prisma.document.create({
      data: {
        userId: escortUserId,
        type,
        status: 'DRAFT' as any,
        url,
      } as any,
    })

    return res.status(201).json({ document: created })
  } catch (e:any) {
    console.error('Agency document upload error', e)
    return res.status(500).json({ error: e?.message || 'Errore interno' })
  }
}
