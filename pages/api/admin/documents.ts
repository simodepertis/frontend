import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

async function requireAdmin(req: NextApiRequest) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null
  const u = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!u) return null
  if (u.ruolo === 'admin') return payload
  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const adm = await requireAdmin(req)
    if (!adm) return res.status(403).json({ error: 'Non autorizzato' })

    if (req.method === 'GET') {
      const status = String((req.query.status as string) || 'IN_REVIEW')

      const documents = await prisma.document.findMany({
        where: { status: status as any },
        include: {
          user: { select: { id: true, nome: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })

      const formattedDocuments = documents.map((doc) => ({
        id: doc.id,
        userId: doc.userId,
        userName: doc.user.nome,
        userEmail: doc.user.email,
        type: doc.type,
        status: doc.status,
        url: doc.url,
        createdAt: doc.createdAt.toISOString().split('T')[0],
      }))

      return res.json({ documents: formattedDocuments })
    }

    if (req.method === 'PATCH') {
      const { documentId, action } = req.body || {}
      if (!documentId || !action) {
        return res.status(400).json({ error: 'Parametri mancanti' })
      }
      if (!['approve', 'reject'].includes(String(action))) {
        return res.status(400).json({ error: 'Azione non valida' })
      }

      const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'
      const updatedDocument = await prisma.document.update({
        where: { id: Number(documentId) },
        data: { status: newStatus as any },
      })

      return res.json({
        success: true,
        document: updatedDocument,
        message: action === 'approve' ? 'Documento approvato con successo' : 'Documento rifiutato',
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('❌ Errore API admin/documents:', error)
    return res.status(500).json({ error: 'Errore interno' })
  }
}
