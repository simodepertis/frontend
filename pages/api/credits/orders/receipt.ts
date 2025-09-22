import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import formidable from 'formidable'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  console.log('📄 API /api/credits/orders/receipt chiamata (Pages Router)')
  
  try {
    // Prendi token dall'header Authorization o dai cookies
    const authHeader = req.headers.authorization
    let token = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else {
      token = req.cookies['auth-token']
    }
    
    if (!token) {
      console.log('❌ Nessun token trovato')
      return res.status(401).json({ error: 'Non autenticato' })
    }

    const payload = verifyToken(token)
    if (!payload) {
      console.log('❌ Token non valido')
      return res.status(401).json({ error: 'Token non valido' })
    }

    // Parse form data
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    
    const orderId = Number(fields.orderId?.[0]);
    const phone = String(fields.phone?.[0] || '').trim();
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    
    if (!orderId || !file) {
      console.log('❌ Parametri mancanti:', { orderId, hasFile: !!file })
      return res.status(400).json({ error: 'Parametri mancanti' })
    }

    // Validazione file (max 5MB, tipi: jpg/jpeg/png/pdf)
    const allowed = ['image/jpeg','image/png','application/pdf'];
    if (!allowed.includes(file.mimetype || '')) {
      console.log('❌ Formato file non valido:', file.mimetype)
      return res.status(400).json({ error: 'Formato non valido. Consenti: JPG, PNG, PDF.' })
    }

    console.log(`📄 Upload ricevuta per ordine ${orderId}, file: ${file.originalFilename}`)

    const order = await prisma.creditOrder.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== payload.userId) {
      console.log('❌ Ordine non trovato o non autorizzato')
      return res.status(404).json({ error: 'Ordine non trovato' })
    }
    
    if (order.status !== 'PENDING') {
      console.log('❌ Ordine non in stato PENDING:', order.status)
      return res.status(400).json({ error: 'Ordine non in stato PENDING' })
    }

    // Save receipt under public/uploads/receipts
    const ext = (file.mimetype && file.mimetype.includes('png')) ? 'png' : 
                 (file.mimetype && file.mimetype.includes('jpeg')) ? 'jpg' : 'bin';
    const dir = path.join(process.cwd(), 'public', 'uploads', 'receipts');
    await mkdir(dir, { recursive: true });
    const filename = `order_${orderId}_${Date.now()}.${ext}`;
    const fullpath = path.join(dir, filename);
    
    // Copy file from temp location to final location
    const fs = require('fs');
    fs.copyFileSync(file.filepath, fullpath);
    
    const publicUrl = `/uploads/receipts/${filename}`;

    // Produzione: NON accreditare. Restare in PENDING finché admin approva.
    await prisma.creditOrder.update({ 
      where: { id: orderId }, 
      data: { 
        receiptUrl: publicUrl, 
        phone: phone || order.phone || null 
      } 
    });

    console.log(`✅ Ricevuta caricata: ${publicUrl}`)
    return res.status(200).json({ 
      ok: true, 
      receiptUrl: publicUrl, 
      message: 'Ricevuta caricata. L\'ordine sarà verificato da un amministratore.' 
    });
  } catch (error: unknown) {
    console.error('❌ ERRORE in /api/credits/orders/receipt:', error)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
