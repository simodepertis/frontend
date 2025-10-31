/**
 * Bot Bakecaincontri - Importa annunci e li salva tramite API
 * 
 * Uso: node scripts/bot-bakecaincontri.js
 * 
 * Parametri opzionali:
 * - CATEGORY: DONNA_CERCA_UOMO | TRANS | UOMO_CERCA_UOMO
 * - CITY: Milano (default)
 * - LIMIT: 20 (default)
 * - USER_ID: ID utente (richiesto)
 * 
 * Esempio: USER_ID=1 CATEGORY=DONNA_CERCA_UOMO CITY=Milano LIMIT=10 node scripts/bot-bakecaincontri.js
 */

const fetch = require('undici').fetch;
const cheerio = require('cheerio');
const { PrismaClient } = require('@prisma/client');
const puppeteer = require('puppeteer');

const prisma = new PrismaClient();

const USER_ID = process.env.USER_ID ? parseInt(process.env.USER_ID, 10) : null;
const CATEGORY = process.env.CATEGORY || 'DONNA_CERCA_UOMO';
const CITY = process.env.CITY || 'Milano';
const LIMIT = parseInt(process.env.LIMIT || '20', 10);
const API_BASE = process.env.API_BASE || 'http://localhost:3000';

if (!USER_ID) {
  console.error('❌ USER_ID richiesto. Esempio: USER_ID=1 node scripts/bot-bakecaincontri.js');
  process.exit(1);
}

const CATEGORY_URLS = {
  DONNA_CERCA_UOMO: 'donna-cerca-uomo',
  TRANS: 'trans',
  UOMO_CERCA_UOMO: 'uomo-cerca-uomo'
};

function buildUrl(city, category) {
  // Struttura: {città}.bakecaincontrii.com/{categoria}/
  return `https://${city.toLowerCase()}.bakecaincontrii.com/${CATEGORY_URLS[category]}/`;
}

async function scrapeLista(url) {
  console.log(`📄 Scarico lista con browser: ${url}`);
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors']
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    console.log('🌐 Caricamento pagina...');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Attendi che il contenuto sia caricato
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🔍 Estrazione link...');
    const links = await page.evaluate(() => {
      const results = [];
      const anchors = document.querySelectorAll('a[href]');
      
      anchors.forEach(a => {
        const href = a.getAttribute('href');
        if (!href) return;
        
        let full = href;
        if (!full.startsWith('http')) {
          full = full.startsWith('/') ? `${window.location.origin}${full}` : `${window.location.origin}/${full}`;
        }
        
        try {
          const u = new URL(full);
          const segs = u.pathname.split('/').filter(Boolean);
          
          // Filtra: path >= 3 segmenti, stesso dominio, non immagini
          if (
            u.host === window.location.host &&
            segs.length >= 3 &&
            !/\.(jpg|jpeg|png|gif|webp|svg|css|js)$/i.test(u.pathname) &&
            !results.includes(full)
          ) {
            results.push(full);
          }
        } catch (e) {}
      });
      
      return results;
    });
    
    console.log(`✅ Trovati ${links.length} link`);
    return links;
    
  } finally {
    await browser.close();
  }
}

async function scrapeDettaglio(url) {
  console.log(`🔍 Scarico dettaglio: ${url}`);
  const res = await fetch(url, { 
    headers: { 'User-Agent': 'Mozilla/5.0' },
    dispatcher: new (require('undici').Agent)({ connect: { rejectUnauthorized: false } })
  });
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const title = ($('h1').first().text() || $('[class*="title"]').first().text()).trim();
  const description = ($('[class*="description"]').first().text() || $('article').text() || $('p').text()).trim();
  
  let phone = null;
  const telHref = $('a[href^="tel:"]').first().attr('href');
  if (telHref) phone = telHref.replace('tel:', '').trim();
  
  let whatsapp = null;
  const waHref = $('a[href*="wa.me"], a[href*="whatsapp"]').first().attr('href');
  if (waHref) whatsapp = waHref;
  
  let age = null;
  const m = $('body').text().match(/(\d{2})\s*anni|età\s*(\d{2})/i);
  if (m) age = parseInt(m[1] || m[2], 10);
  
  const photos = [];
  $('img').each((_, img) => {
    const src = $(img).attr('src') || $(img).attr('data-src');
    if (src && src.startsWith('http') && !src.includes('logo') && !photos.includes(src)) {
      photos.push(src);
    }
  });
  
  return { title, description, phone, whatsapp, age, photos };
}

async function salvaAnnuncio(data, sourceUrl) {
  const sourceId = `bot_${CATEGORY}_${Buffer.from(sourceUrl).toString('base64').slice(0, 20)}`;
  
  // Controlla se esiste già
  const exists = await prisma.quickMeeting.findFirst({
    where: { sourceId, userId: USER_ID }
  });
  
  if (exists) {
    throw new Error('Già esistente');
  }
  
  // Salva nuovo annuncio
  const meeting = await prisma.quickMeeting.create({
    data: {
      title: data.title,
      description: data.description || data.title,
      category: CATEGORY,
      city: CITY.toUpperCase(),
      phone: data.phone || null,
      whatsapp: data.whatsapp || null,
      age: data.age || null,
      photos: data.photos || [],
      sourceUrl,
      sourceId,
      userId: USER_ID,
      isActive: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });
  
  return meeting;
}

async function main() {
  console.log(`🤖 Bot Bakecaincontri START`);
  console.log(`📊 Parametri: USER_ID=${USER_ID}, CATEGORY=${CATEGORY}, CITY=${CITY}, LIMIT=${LIMIT}`);
  
  if (!CATEGORY_URLS[CATEGORY]) {
    console.error(`❌ Categoria non valida: ${CATEGORY}`);
    process.exit(1);
  }
  
  const url = buildUrl(CITY, CATEGORY);
  console.log(`📄 URL: ${url}`);
  
  let links = await scrapeLista(url);
  
  if (!links || links.length === 0) {
    console.error(`❌ Nessun annuncio trovato`);
    process.exit(1);
  }
  
  let imported = 0;
  let skipped = 0;
  
  for (const href of links.slice(0, LIMIT)) {
    try {
      const d = await scrapeDettaglio(href);
      
      if (!d.title || d.title.length < 5) {
        console.log(`⏭️ Skip: titolo troppo corto`);
        skipped++;
        continue;
      }
      
      if (!d.photos || d.photos.length === 0) {
        console.log(`⏭️ Skip: nessuna foto`);
        skipped++;
        continue;
      }
      
      await salvaAnnuncio({
        title: d.title,
        description: d.description || d.title,
        phone: d.phone || '',
        whatsapp: d.whatsapp || '',
        age: d.age || null,
        photos: d.photos
      }, href);
      
      imported++;
      console.log(`✅ Importato: ${d.title.substring(0, 50)}...`);
      
    } catch (error) {
      if (error.message === 'Già esistente') {
        console.log(`⏭️ Skip: già esistente`);
      } else {
        console.error(`❌ Errore su ${href}:`, error.message);
      }
      skipped++;
    }
  }
  
  await prisma.$disconnect();
  
  console.log(`\n🎉 COMPLETATO`);
  console.log(`📊 Importati: ${imported}`);
  console.log(`⏭️ Saltati: ${skipped}`);
}

main().catch(async (err) => {
  console.error('❌ Errore fatale:', err);
  await prisma.$disconnect();
  process.exit(1);
});
