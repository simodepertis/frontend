import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

function normalizeUploadUrl(u: string | null | undefined): string {
  const s = String(u || '').trim()
  if (!s) return ''
  if (s.startsWith('/uploads/')) return `/api${s}`
  return s
}

function sanitizePhotos(input: any): string[] {
  let arr: any[] = []
  if (Array.isArray(input)) {
    arr = input
  } else if (typeof input === 'string') {
    const s = input.trim()
    if (!s) return []
    if (s.startsWith('[')) {
      try {
        const parsed = JSON.parse(s)
        if (Array.isArray(parsed)) arr = parsed
        else arr = [s]
      } catch {
        arr = [s]
      }
    } else {
      arr = [s]
    }
  } else if (input && typeof input === 'object') {
    const maybe = (input as any).photos
    if (Array.isArray(maybe)) arr = maybe
  }

  return arr
    .filter((x) => typeof x === 'string')
    .map((x) => String(x).trim())
    .filter((x) => x.length > 0)
    .filter((x) => !x.startsWith('data:'))
    .filter((x) => x.length < 8192)
    .map((x) => normalizeUploadUrl(x))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'ID richiesto' })
  }

  const meetingId = parseInt(id)
  if (isNaN(meetingId)) {
    return res.status(400).json({ error: 'ID non valido' })
  }

  if (req.method === 'GET') {
    try {
      const meeting = await prisma.quickMeeting.findFirst({
        where: {
          id: meetingId,
          isActive: true,
          expiresAt: {
            gt: new Date()
          }
        }
      })

      if (!meeting) {
        return res.status(404).json({ error: 'Incontro non trovato' })
      }

      return res.json({ meeting: { ...meeting, photos: sanitizePhotos((meeting as any).photos) } })
    } catch (error) {
      console.error('Errore recupero incontro:', error)
      return res.status(500).json({ error: 'Errore interno del server' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
