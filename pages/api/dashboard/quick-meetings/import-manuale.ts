import type { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import { QuickMeetingCategory } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import * as cheerio from 'cheerio'
import { fetch } from 'undici'

// usa prisma condiviso

function getUserFromToken(req: NextApiRequest): { userId: number } | null {
  try {
    const token = req.cookies['auth-token']
    if (!token) return null
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number, email: string }
    return { userId: decoded.userId }
  } catch {
    return null
  }
}

function buildCategoryUrl(category: QuickMeetingCategory, city: string) {
  const c = city.toLowerCase()
  if (category === 'CENTRO_MASSAGGI') {
    // bakeca massaggi
    return `https://www.bakeca.it/annunci/massaggi-benessere/${encodeURIComponent(c)}/`
  }
  // bakecaincontrii
  const baseByCat: Record<QuickMeetingCategory, string> = {
    DONNA_CERCA_UOMO: 'https://www.bakecaincontri.com/donna-cerca-uomo',
    TRANS: 'https://www.bakecaincontri.com/trans',
    UOMO_CERCA_UOMO: 'https://www.bakecaincontri.com/uomo-cerca-uomo',
    CENTRO_MASSAGGI: ''
  }
  return `${baseByCat[category]}/${encodeURIComponent(c)}/`
}

function buildCategoryBaseUrl(category: QuickMeetingCategory) {
  if (category === 'CENTRO_MASSAGGI') {
    return 'https://www.bakeca.it/annunci/massaggi-benessere/'
  }
  const baseByCat: Record<QuickMeetingCategory, string> = {
    DONNA_CERCA_UOMO: 'https://www.bakecaincontri.com/donna-cerca-uomo/',
    TRANS: 'https://www.bakecaincontri.com/trans/',
    UOMO_CERCA_UOMO: 'https://www.bakecaincontri.com/uomo-cerca-uomo/',
    CENTRO_MASSAGGI: ''
  }
  return baseByCat[category]
}

function buildCandidateUrls(category: QuickMeetingCategory, city: string) {
  const c = city.toLowerCase()
  if (category === 'CENTRO_MASSAGGI') {
    return [
      `https://www.bakeca.it/annunci/massaggi-benessere/${encodeURIComponent(c)}/`,
      'https://www.bakeca.it/annunci/massaggi-benessere/'
    ]
  }
  // Prova sia category-first che city-first
  const catFirstByCat: Record<QuickMeetingCategory, string> = {
    DONNA_CERCA_UOMO: 'https://www.bakecaincontri.com/donna-cerca-uomo',
    TRANS: 'https://www.bakecaincontri.com/trans',
    UOMO_CERCA_UOMO: 'https://www.bakecaincontri.com/uomo-cerca-uomo',
    CENTRO_MASSAGGI: ''
  }
  const cityFirst = `https://www.bakecaincontri.com/${encodeURIComponent(c)}/`
  const catFirst = `${catFirstByCat[category]}/${encodeURIComponent(c)}/`
  const justCat = `${catFirstByCat[category]}/`
  // fallback dominio alternativo (doppia i)
  const altCatFirstByCat: Record<QuickMeetingCategory, string> = {
    DONNA_CERCA_UOMO: 'https://www.bakecaincontrii.com/donna-cerca-uomo',
    TRANS: 'https://www.bakecaincontrii.com/trans',
    UOMO_CERCA_UOMO: 'https://www.bakecaincontrii.com/uomo-cerca-uomo',
    CENTRO_MASSAGGI: ''
  }
  const altCityFirst = `https://www.bakecaincontrii.com/${encodeURIComponent(c)}/`
  const altCatFirst = `${altCatFirstByCat[category]}/${encodeURIComponent(c)}/`
  const altJustCat = `${altCatFirstByCat[category]}/`
  return [catFirst, cityFirst, justCat, altCatFirst, altCityFirst, altJustCat]
}

function toSourceId(category: QuickMeetingCategory, href: string) {
  return `src_${category}_${Buffer.from(href).toString('base64').slice(0, 20)}`
}

async function scrapeBakecaMassaggi(listUrl: string) {
  const res = await fetch(listUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  const html = await res.text()
  const $ = cheerio.load(html)
  const links = new Set<string>()
  $('a[href*="/dettaglio/"]').each((_, a) => {
    const href = $(a).attr('href')
    if (!href) return
    const full = href.startsWith('http') ? href : `https://${new URL(listUrl).host}${href}`
    links.add(full)
  })
  // Stop to details is heavy on Bakeca; we collect hero image + title from list
  const items: { href: string, title: string, photo?: string }[] = []
  $('article, li, .item, .list-item').each((_, el) => {
    const a = $(el).find('a[href*="/dettaglio/"]').first()
    const href = a.attr('href')
    if (!href) return
    const full = href.startsWith('http') ? href : `https://${new URL(listUrl).host}${href}`
    const title = ($(el).find('h2, h3, .title').first().text() || '').trim()
    const img = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src')
    items.push({ href: full, title, photo: img })
  })
  // Ensure only those with link
  const merged = Array.from(links).map(href => {
    const it = items.find(x => x.href === href)
    return { href, title: it?.title || 'Annuncio massaggi', photo: it?.photo }
  })
  return merged
}

async function scrapeBakecaincontriiList(listUrl: string) {
  const res = await fetch(listUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  const html = await res.text()
  const $ = cheerio.load(html)
  const links: string[] = []
  const host = new URL(listUrl).host
  // Selettori più stretti per card/annuncio (immagini + titoli)
  $('article, .card, .listing, li, .item, .ad, .annuncio, .post').each((_, el) => {
    const a = $(el).find('a[href]:has(img), a[href][title], a[href].title, a[href].ad').first()
    const href = a.attr('href') || ''
    if (!href) return
    let full = href
    if (!full.startsWith('http')) full = `https://${host}${href.startsWith('/') ? href : '/' + href}`
    try {
      const u = new URL(full)
      // Filtra: path con almeno 3 segmenti, non favicon, non root categoria
      const segs = u.pathname.split('/').filter(Boolean)
      if (
        u.host === host &&
        segs.length >= 3 &&
        !full.endsWith('/') &&
        !/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(u.pathname)
      ) {
        if (!links.includes(full)) links.push(full)
      }
    } catch {}
  })
  // fallback: prendi tutti gli anchor verso il dominio con path > 1 segmento
  if (links.length === 0) {
    $('a[href]').each((_, a) => {
      const href = $(a).attr('href') || ''
      let full = href
      if (!full.startsWith('http')) full = `https://${host}${href.startsWith('/') ? href : '/' + href}`
      try {
        const u = new URL(full)
        if (
          u.host === host &&
          u.pathname.split('/').filter(Boolean).length >= 3 &&
          !/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(u.pathname)
        ) {
          if (!links.includes(full)) links.push(full)
        }
      } catch {}
    })
  }
  return Array.from(new Set(links))
}

async function scrapeBakecaincontriiDetail(url: string) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  const html = await res.text()
  const $ = cheerio.load(html)
  const title = ($('h1').first().text() || $('[class*="title"], .title').first().text()).trim()
  const description = ($('[class*="description"], .description, [itemprop="description"]').first().text() || $('article').text() || $('p').text()).trim()
  let phone: string | null = null
  const telHref = $('a[href^="tel:"]').first().attr('href')
  if (telHref) phone = telHref.replace('tel:', '').trim()
  let whatsapp: string | null = null
  const waHref = $('a[href*="wa.me"], a[href*="api.whatsapp"], a[href*="whatsapp"]').first().attr('href')
  if (waHref) whatsapp = waHref
  let age: number | null = null
  const ageText = $('body').text()
  const m = ageText.match(/(\d{2})\s*anni|età\s*(\d{2})/i)
  if (m) age = parseInt((m[1] || m[2]) as string, 10)
  const photos: string[] = []
  $('img').each((_, img) => {
    const src = $(img).attr('src') || $(img).attr('data-src')
    if (src && src.startsWith('http') && !src.includes('logo') && !photos.includes(src)) photos.push(src)
  })
  return { title, description, phone, whatsapp, age, photos }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo non consentito' })

  const auth = getUserFromToken(req)
  if (!auth) return res.status(401).json({ error: 'Non autorizzato' })
  const userId = auth.userId

  const { category, city = 'Milano', limit = 20, dryRun = false } = req.body as { category: QuickMeetingCategory, city?: string, limit?: number, dryRun?: boolean }
  if (!category || !Object.values(QuickMeetingCategory).includes(category)) {
    return res.status(400).json({ error: 'Categoria non valida' })
  }

  const listUrl = buildCategoryUrl(category, city)
  const baseUrl = buildCategoryBaseUrl(category)
  const tried: string[] = []
  try {
    let imported = 0
    let skipped = 0

    if (category === 'CENTRO_MASSAGGI') {
      let items = await scrapeBakecaMassaggi(listUrl); tried.push(listUrl)
      if (!items || items.length === 0) {
        items = await scrapeBakecaMassaggi(baseUrl); tried.push(baseUrl)
      }
      for (const it of items.slice(0, limit)) {
        const sourceId = toSourceId(category, it.href)
        const exists = await prisma.quickMeeting.findFirst({ where: { sourceId, userId } })
        if (exists) { skipped++; continue }
        if (dryRun) continue
        await prisma.quickMeeting.create({
          data: {
            title: it.title || 'Annuncio massaggi',
            description: it.title || null,
            category: 'CENTRO_MASSAGGI',
            city: city.toUpperCase(),
            photos: it.photo ? [it.photo] : [],
            sourceUrl: it.href,
            sourceId,
            userId,
            isActive: true,
            expiresAt: new Date(Date.now() + 30*24*60*60*1000)
          }
        })
        imported++
      }
    } else {
      let links: string[] = []
      const candidates = buildCandidateUrls(category, city)
      for (const u of candidates) {
        tried.push(u)
        try {
          const part = await scrapeBakecaincontriiList(u)
          if (part && part.length) { links = part; break }
        } catch {}
      }
      if (!links || links.length === 0) {
        // ultimo tentativo con l'URL originale calcolato
        tried.push(listUrl)
        links = await scrapeBakecaincontriiList(listUrl)
      }
      const toProcess = links.slice(0, limit)
      if (dryRun) {
        // Prova a leggere il primo dettaglio per validare i selettori
        let sample: any = null
        if (toProcess[0]) {
          try { sample = await scrapeBakecaincontriiDetail(toProcess[0]) } catch {}
        }
        return res.status(200).json({ imported: 0, skipped: 0, debug: { tried, links: toProcess, sample } })
      }
      for (const href of toProcess) {
        const sourceId = toSourceId(category, href)
        const exists = await prisma.quickMeeting.findFirst({ where: { sourceId, userId } })
        if (exists) { skipped++; continue }
        const d = await scrapeBakecaincontriiDetail(href)
        // Crea solo annunci reali: titolo valido e almeno 1 foto (alcuni nascondono il contatto finché non clicchi)
        if (!d.title || d.title.length < 5) { skipped++; continue }
        const hasPhoto = Array.isArray(d.photos) && d.photos.length > 0
        if (!hasPhoto) { skipped++; continue }
        await prisma.quickMeeting.create({
          data: {
            title: d.title,
            description: d.description || d.title,
            category,
            city: city.toUpperCase(),
            phone: d.phone || null,
            whatsapp: d.whatsapp || null,
            age: d.age || null,
            photos: d.photos || [],
            sourceUrl: href,
            sourceId,
            userId,
            isActive: true,
            expiresAt: new Date(Date.now() + 30*24*60*60*1000)
          }
        })
        imported++
      }
    }

    return res.status(200).json({ imported, skipped })
  } catch (e: any) {
    console.error('Import error', e?.message)
    return res.status(500).json({ error: 'Errore durante l\'importazione' })
  }
}
