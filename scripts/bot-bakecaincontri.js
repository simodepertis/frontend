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
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizePhone(raw) {
  const v = String(raw || '').trim();
  if (!v) return null;
  const digits = v.replace(/[^0-9+]/g, '');
  if (!digits) return null;
  if (digits.startsWith('+')) return digits;
  // Se sembra già contenere il country code (es. 39xxxxxxxxxx) aggiungi solo il +
  if (digits.startsWith('39') && digits.length >= 11 && digits.length <= 13) return `+${digits}`;
  if (digits.length >= 8 && digits.length <= 11) return `+39${digits}`;
  return `+${digits}`;
}

function buildWhatsAppLink(phoneRaw, whatsappRaw) {
  const v = String(whatsappRaw || '').trim();
  let wa = null;
  if (v) {
    if (/^https?:\/\//i.test(v)) {
      const m = v.match(/(\+?\d[0-9]{7,14})/);
      wa = m ? m[1] : null;
    } else {
      wa = v;
    }
  }
  const normalized = normalizePhone(wa) || normalizePhone(phoneRaw);
  if (!normalized) return null;
  const digitsOnly = normalized.replace(/\D/g, '');
  if (!digitsOnly) return null;
  return `https://wa.me/${digitsOnly}`;
}

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

// Fallback città usata quando CITY=ALL se il parsing della lista ufficiale fallisce
const DEFAULT_CITIES_FALLBACK = [
  'Milano',
  'Roma',
  'Torino',
  'Napoli',
  'Bologna',
  'Firenze',
];

let _cachedAllCities = null;

async function fetchBakecaCityCodes() {
  // Prendiamo una pagina qualunque (Napoli) per leggere il JS che contiene: var cities=[{code:"..."},...]
  // NOTA: in alcuni ambienti la fetch server-side viene bloccata (HTTP 403), quindi usiamo Puppeteer.
  const url = 'https://napoli.bakecaincontrii.com/donna-cerca-uomo/';
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors']
  });
  let html = '';
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    await sleep(1500);
    html = await page.content();
  } finally {
    await browser.close();
  }

  const start = html.indexOf('var cities=[');
  if (start === -1) throw new Error('cities array not found');

  // Tagliamo una finestra ragionevole fino a un marker successivo noto
  const afterStart = html.slice(start);
  const endMarker = '];var functional_cookies';
  const endIdx = afterStart.indexOf(endMarker);
  const chunk = endIdx !== -1 ? afterStart.slice(0, endIdx) : afterStart.slice(0, 250000);

  const codes = [];
  const re = /code:"([a-z0-9-]+)"/gi;
  let m;
  while ((m = re.exec(chunk))) {
    const code = String(m[1] || '').trim();
    if (code && !codes.includes(code)) codes.push(code);
  }
  if (codes.length === 0) throw new Error('no city codes parsed');
  return codes;
}

async function getAllCitiesForAllMode() {
  if (Array.isArray(_cachedAllCities) && _cachedAllCities.length > 0) return _cachedAllCities;
  try {
    const codes = await fetchBakecaCityCodes();
    _cachedAllCities = codes;
    console.log(`🏙️ CITY=ALL: caricate ${codes.length} città dalla lista ufficiale Bakecaincontrii`);
    return codes;
  } catch (e) {
    console.log(`⚠️ CITY=ALL: impossibile caricare lista città da Bakecaincontrii (${e?.message || e}). Uso fallback (${DEFAULT_CITIES_FALLBACK.length}).`);
    _cachedAllCities = DEFAULT_CITIES_FALLBACK;
    return DEFAULT_CITIES_FALLBACK;
  }
}

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
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });

    // Gestione popup 18+ / cookie
    try {
      await sleep(2000);
      // prova prima con il bottone esplicito "Accetto"
      const accettoButton = await page.$('button[aria-label="Accetto"]');
      if (accettoButton) {
        console.log('✅ Click su bottone [aria-label="Accetto"]');
        await accettoButton.click();
      } else {
        // fallback: cerca bottoni/link con testo che contiene "Accetto" ecc.
        await page.evaluate(() => {
          const candidates = Array.from(document.querySelectorAll('button, a'));
          const acceptTexts = ['accetto', 'accetta', 'ho più di 18', 'ho piu di 18', 'enter'];

          for (const el of candidates) {
            const text = (el.textContent || '').toLowerCase().trim();
            if (!text) continue;
            if (acceptTexts.some(t => text.includes(t))) {
              (el instanceof HTMLElement) && el.click();
              break;
            }
          }
        });
      }

      // dai tempo alla pagina di aggiornarsi dopo il click
      await sleep(3000);
    } catch (e) {
      console.log('ℹ️ Nessun popup 18+/cookie rilevato o gestione non necessaria');
    }
    
    // Attendi che il contenuto sia caricato
    await sleep(2000);

    // DEBUG: salva HTML della pagina per capire cosa vede Puppeteer
    try {
      const debugPath = process.platform === 'win32'
        ? path.join(__dirname, 'debug-bakecaincontri.html')
        : '/root/debug-bakecaincontri.html';
      const html = await page.content();
      fs.writeFileSync(debugPath, html);
      console.log(`💾 Salvato HTML in ${debugPath}`);
    } catch (e) {
      console.log('⚠️ Impossibile salvare HTML di debug:', e.message);
    }
    
    console.log('🔍 Estrazione link...');
    const links = await page.evaluate(() => {
      const results = [];

      // Link annuncio tipico:
      // <a href="https://www.bakecaincontrii.com/annuncio/..." ...>
      const anchors = document.querySelectorAll('a[href*="/annuncio/"]');

      anchors.forEach(a => {
        const href = a.getAttribute('href');
        if (!href) return;

        let full = href;
        if (!full.startsWith('http')) {
          full = full.startsWith('/') ? `${window.location.origin}${full}` : `${window.location.origin}/${full}`;
        }

        try {
          const u = new URL(full);

          // Accettiamo anche host diversi (es. www.bakecaincontrii.com vs milano.bakecaincontrii.com)
          if (
            u.pathname.includes('/annuncio/') &&
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
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors']
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    await sleep(2000);

    // Estrazione telefono/WhatsApp da DOM renderizzato (spesso il numero è testo nel bottone, non tel:)
    const domContacts = await page.evaluate(() => {
      const cleanDigits = (s) => (String(s || '').replace(/\D/g, '') || '');

      // 1) tel:
      const telA = document.querySelector('a[href^="tel:"]');
      const telHref = telA ? telA.getAttribute('href') : null;

      // 2) numero visibile nel bottone (riquadro rosa):
      // prova prima con elementi che contengono solo cifre, poi fallback su testo misto ("Chiama ora 333...")
      let phoneText = null;
      const candidates = Array.from(document.querySelectorAll('button, a, div, span'));
      for (const el of candidates) {
        const t = (el.textContent || '').trim();
        if (!t) continue;
        const digits = cleanDigits(t);
        if (!digits) continue;

        // Caso 1: testo composto solo da cifre/spazi/trattini
        const nonDigits = t.replace(/[0-9\s\-\.]/g, '').trim();
        if (nonDigits.length === 0) {
          if (digits.length >= 8 && digits.length <= 13) {
            phoneText = digits;
            break;
          }
          continue;
        }

        // Caso 2 (fallback): testo misto, estrai la prima sequenza 8-13 cifre
        // es. "Chiama ora 333 123 4567" / "Telefono: 339..."
        const m = t.match(/(\+?\d[\d\s\-\.]{7,14})/);
        if (m && m[1]) {
          const extracted = cleanDigits(m[1]);
          if (extracted.length >= 8 && extracted.length <= 13) {
            phoneText = extracted;
            break;
          }
        }
      }

      // 3) WhatsApp link (wa.me / whatsapp)
      const waA = document.querySelector('a[href*="wa.me"], a[href*="whatsapp"]');
      const waHref = waA ? waA.getAttribute('href') : null;

      return { telHref, phoneText, waHref };
    });

    const html = await page.content();
    const $ = cheerio.load(html);

    const title = ($('h1').first().text() || $('[class*="title"]').first().text()).trim();
    const description = ($('[class*="description"]').first().text() || $('article').text() || $('p').text()).trim();

    let phone = null;
    const telHref = $('a[href^="tel:"]').first().attr('href');
    if (telHref) {
      phone = telHref.replace('tel:', '').replace(/[^0-9+]/g, '').trim();
    }

    // Fallback sicuro: numero visibile nel bottone (riquadro rosa)
    if (!phone && domContacts && domContacts.phoneText) {
      phone = String(domContacts.phoneText).trim();
    }

    let whatsapp = null;
    const waHref = $('a[href*="wa.me"], a[href*="whatsapp"]').first().attr('href') || (domContacts && domContacts.waHref);
    if (waHref) {
      // prova a estrarre il numero dall'URL (es. https://wa.me/39xxxxxxxxx o ?phone=39...)
      const waNumberMatch = waHref.match(/(\+?\d[0-9]{7,14})/);
      whatsapp = waNumberMatch ? waNumberMatch[0] : waHref;
    }

    // Normalizza sempre (così su sito tel:/wa.me funzionano)
    phone = normalizePhone(phone);
    whatsapp = buildWhatsAppLink(phone, whatsapp);

    let age = null;
    const m = $('body').text().match(/(\d{2})\s*anni|età\s*(\d{2})/i);
    if (m) age = parseInt(m[1] || m[2], 10);

    // Estrazione foto potenziata con page.evaluate per gestire JS
    const photos = await page.evaluate(() => {
      const results = new Set();
      const imageSelectors = [
        '.ad-photos-slick-item img',
        '.ad-photos-grid-item img',
        '.carousel-slide.gallery-item img', // nuovo carousel principale
        '.post-gallery img',
        'article img',
        'img[alt*="foto"]',
        'img[src*="/image/post/"]', // nuovo path immagini
        'img[src*="/image/"]'
      ];

      for (const selector of imageSelectors) {
        const images = document.querySelectorAll(selector);
        images.forEach(img => {
          const src = img.getAttribute('data-src') || img.getAttribute('src');
          if (src) {
            try {
              const fullUrl = new URL(src, window.location.href).href;
              if (!fullUrl.includes('logo')) {
                results.add(fullUrl);
              }
            } catch {}
          }
        });
      }

      // Fallback: prova a leggere gli href delle gallery-item se per qualche motivo gli <img> non hanno src
      if (results.size === 0) {
        const anchors = document.querySelectorAll('.carousel-slide.gallery-item a[href*="/image/"]');
        anchors.forEach(a => {
          const href = a.getAttribute('href');
          if (href) {
            try {
              const fullUrl = new URL(href, window.location.href).href;
              if (!fullUrl.includes('logo')) {
                results.add(fullUrl);
              }
            } catch {}
          }
        });
      }

      return Array.from(results);
    });

    // DEBUG: se ancora nessuna foto, salva HTML dettaglio per analisi
    if (photos.length === 0) {
      try {
        const debugDir = process.platform === 'win32'
          ? __dirname
          : '/root';
        const safeSlug = Buffer.from(url).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
        const debugPath = process.platform === 'win32'
          ? path.join(debugDir, `debug-detail-${safeSlug}.html`)
          : `${debugDir}/debug-detail-${safeSlug}.html`;

        fs.writeFileSync(debugPath, html);
        console.log(`💾 Salvato dettaglio senza foto in ${debugPath}`);
      } catch (e) {
        console.log('⚠️ Impossibile salvare dettaglio senza foto:', e.message);
      }
    }

    return { title, description, phone, whatsapp, age, photos };
  } finally {
    await browser.close();
  }
}

async function salvaAnnuncio(data, sourceUrl, category, city) {
  const sourceId = `bot_${category}_${Buffer.from(sourceUrl).toString('base64').slice(0, 20)}`;
  
  // Controlla se esiste già
  const exists = await prisma.quickMeeting.findFirst({
    where: { sourceUrl, userId: USER_ID }
  });
  
  if (exists) {
    throw new Error('Già esistente');
  }
  
  // Salva nuovo annuncio
  const meeting = await prisma.quickMeeting.create({
    data: {
      title: data.title,
      description: data.description || data.title,
      category,
      city: city.toUpperCase(),
      phone: normalizePhone(data.phone) || null,
      whatsapp: buildWhatsAppLink(data.phone, data.whatsapp) || null,
      age: data.age || null,
      // Il cliente non vuole più le foto reali sugli annunci importati dal bot:
      // salviamo photos vuoto così il frontend usa solo il placeholder.
      photos: [],
      sourceUrl,
      sourceId,
      userId: USER_ID,
      isActive: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });
  
  return meeting;
}

async function runOnceFor(city, category) {
  console.log(`🤖 Bot Bakecaincontri RUN`);
  console.log(`📊 Parametri: USER_ID=${USER_ID}, CATEGORY=${category}, CITY=${city}, LIMIT=${LIMIT}`);

  if (!CATEGORY_URLS[category]) {
    console.error(`❌ Categoria non valida: ${category}`);
    return;
  }

  const baseUrl = buildUrl(city, category);
  console.log(`📄 URL base: ${baseUrl}`);

  // Paginazione: scorri /?page=2,3,... finché trovi annunci o raggiungi LIMIT
  const maxAds = LIMIT > 0 ? LIMIT : Number.MAX_SAFE_INTEGER;
  const maxPages = 50; // sicurezza per non ciclare all'infinito
  const links = [];

  for (let page = 1; page <= maxPages && links.length < maxAds; page++) {
    const pageUrl = page === 1 ? baseUrl : `${baseUrl}?page=${page}`;
    console.log(`📄 URL pagina ${page}: ${pageUrl}`);

    const pageLinks = await scrapeLista(pageUrl);

    if (!pageLinks || pageLinks.length === 0) {
      if (page === 1) {
        console.error(`❌ Nessun annuncio trovato`);
      } else {
        console.log(`ℹ️ Nessun annuncio aggiuntivo a pagina ${page}, stop paginazione`);
      }
      break;
    }

    for (const href of pageLinks) {
      if (!links.includes(href) && links.length < maxAds) {
        links.push(href);
      }
    }
  }

  if (!links.length) {
    return;
  }

  let imported = 0;
  let skipped = 0;

  for (const href of links) {
    try {
      const d = await scrapeDettaglio(href);

      if (!d.title || d.title.length < 5) {
        console.log(`⏭️ Skip: titolo troppo corto`);
        skipped++;
        continue;
      }

      // Se non riusciamo a ricavare nessun contatto (telefono/WhatsApp), non importiamo.
      // Questo evita annunci senza contatti nella sidebar.
      if (!d.phone && !d.whatsapp) {
        console.log(`⏭️ Skip: nessun contatto (telefono/whatsapp)`);
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
      }, href, category, city);

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

  console.log(`\n🎉 RUN COMPLETATA per CITY=${city}, CATEGORY=${category}`);
  console.log(`📊 Importati: ${imported}`);
  console.log(`⏭️ Saltati: ${skipped}`);
}

async function runOnce() {
  // Determina categorie
  let categories;
  if (CATEGORY === 'ALL') {
    categories = Object.keys(CATEGORY_URLS);
  } else if (!CATEGORY_URLS[CATEGORY]) {
    console.error(`❌ Categoria non valida: ${CATEGORY}`);
    return;
  } else {
    categories = [CATEGORY];
  }

  // Determina città
  const cities = CITY === 'ALL' ? await getAllCitiesForAllMode() : [CITY];

  for (const city of cities) {
    for (const category of categories) {
      try {
        await runOnceFor(city, category);
      } catch (err) {
        console.error(`❌ Errore run per CITY=${city}, CATEGORY=${category}:`, err.message || err);
      }
    }
  }
}

async function main() {
  const LOOP = process.env.LOOP === '1';
  const INTERVAL_MINUTES = parseInt(process.env.INTERVAL_MINUTES || '10', 10);

  if (!LOOP) {
    await runOnce();
    await prisma.$disconnect();
    return;
  }

  console.log(`♻️ Modalità LOOP attiva (INTERVAL_MINUTES=${INTERVAL_MINUTES})`);

  while (true) {
    try {
      await runOnce();
    } catch (err) {
      console.error('❌ Errore in runOnce:', err);
    }

    console.log(`⏸️ Attendo ${INTERVAL_MINUTES} minuti prima del prossimo giro...`);
    await sleep(INTERVAL_MINUTES * 60 * 1000);
  }
}

main().catch(async (err) => {
  console.error('❌ Errore fatale:', err);
  await prisma.$disconnect();
  process.exit(1);
});
