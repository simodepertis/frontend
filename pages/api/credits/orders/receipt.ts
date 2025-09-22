import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Non autenticato' })
    const payload = verifyToken(token)
    if (!payload) return res.status(401).json({ error: 'Token non valido' })

    // Next.js Pages API non supporta formData() come App Router; usiamo multiparty o busboy.
    // Per semplicità, gestiamo solo upload base via raw buffer inviato come binary body non è pratico qui.
    // Adeguiamo la UI a inviare base64? Manteniamo compatibilità usando formidable dynamic import.
    const formidable = (await import('formidable')).default
    const form = formidable({ multiples: false, maxFileSize: 5 * 1024 * 1024 })

    const { fields, files } = await new Promise<any>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err)
        else resolve({ fields, files })
      })
    })

    const orderId = Number(fields.orderId?.[0] || fields.orderId)
    const phone = String(fields.phone?.[0] || fields.phone || '').trim()
    const file: any = files.file
    if (!orderId || !file) return res.status(400).json({ error: 'Parametri mancanti' })

    const order = await prisma.creditOrder.findUnique({ where: { id: orderId } })
    if (!order || order.userId !== payload.userId) return res.status(404).json({ error: 'Ordine non trovato' })
    if (order.status !== 'PENDING') return res.status(400).json({ error: 'Ordine non in stato PENDING' })

    const dir = path.join(process.cwd(), 'public', 'uploads', 'receipts')
    await mkdir(dir, { recursive: true })
    const orig = Array.isArray(file) ? file[0] : file
    const extFromType = (t: string) => (t?.includes('png') ? 'png' : t?.includes('jpeg') ? 'jpg' : 'bin')
    const ext = extFromType(orig.mimetype || orig.mime || 'application/octet-stream')
    const filename = `order_${orderId}_${Date.now()}.${ext}`
    const fullpath = path.join(dir, filename)

    // Move/copy file buffer
    const data = await (await import('node:fs/promises')).readFile(orig.filepath || orig.path)
    await writeFile(fullpath, data)
    const publicUrl = `/uploads/receipts/${filename}`

    await prisma.creditOrder.update({ where: { id: orderId }, data: { receiptUrl: publicUrl, phone: phone || order.phone || null } })

    return res.json({ ok: true, receiptUrl: publicUrl, message: "Ricevuta caricata. L'ordine sarà verificato da un amministratore." })
  } catch (e) {
    return res.status(500).json({ error: 'Errore interno' })
  }
}
