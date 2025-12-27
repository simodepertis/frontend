/**
 * Bot Bakeca Massaggi - Importa annunci massaggi da bakeca.it
 * 
 * Uso: node scripts/bot-bakeca-massaggi.js
 * 
 * Parametri opzionali:
 * - USER_ID: ID utente (richiesto)
 * - CITY: Milano (default)
 * - LIMIT: 20 (default)
 * 
 * Esempio: USER_ID=1 CITY=Milano LIMIT=10 node scripts/bot-bakeca-massaggi.js
 */

const fetch = require('undici').fetch;
const cheerio = require('cheerio');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const USER_ID = process.env.USER_ID ? parseInt(process.env.USER_ID, 10) : null;
const CITY = process.env.CITY || 'Milano';
const LIMIT = parseInt(process.env.LIMIT || '20', 10);

if (!USER_ID) {
  console.error('❌ USER_ID richiesto. Esempio: USER_ID=1 node scripts/bot-bakeca-massaggi.js');
  process.exit(1);
}

async function scrapeLista(url) {
  console.log(`📄 Scarico lista da: ${url}`);
  const res = await fetch(url, { 
    headers: { 'User-Agent': 'Mozilla/5.0' },
    dispatcher: new (require('undici').Agent)({ connect: { rejectUnauthorized: false } })
  });
  const html = await res.text();
  const $ = cheerio.load(html);
  const links = new Set();
  
  $('a[href*="/dettaglio/"]').each((_, a) => {
    const href = $(a).attr('href');
    if (!href) return;
    const full = href.startsWith('http') ? href : `https://www.bakeca.it${href}`;
    links.add(full);
  });
  
  const items = [];
  $('article, li, .item, .list-item').each((_, el) => {
    const a = $(el).find('a[href*="/dettaglio/"]').first();
    const href = a.attr('href');
    if (!href) return;
    const full = href.startsWith('http') ? href : `https://www.bakeca.it${href}`;
    const title = ($(el).find('h2, h3, .title').first().text() || '').trim();
    const img = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src');
    items.push({ href: full, title, photo: img });
  });
  
  const merged = Array.from(links).map(href => {
    const it = items.find(x => x.href === href);
    return { href, title: it?.title || 'Annuncio massaggi', photo: it?.photo };
  });
  
  console.log(`✅ Trovati ${merged.length} annunci`);

  // DEBUG: se non troviamo nulla, salviamo l'HTML per analizzarlo
  if (merged.length === 0) {
    try {
      const fs = require('fs');
      const path = require('path');
      const debugPath = path.join(__dirname, 'debug-bakeca-massaggi.html');
      fs.writeFileSync(debugPath, html);
      console.log(`💾 Salvato HTML debug massaggi in ${debugPath}`);
    } catch (e) {
      console.log('⚠️ Impossibile salvare HTML debug massaggi:', e.message);
    }
  }

  return merged;
}

async function salvaAnnuncio(data, sourceUrl) {
  const sourceId = `bot_CENTRO_MASSAGGI_${Buffer.from(sourceUrl).toString('base64').slice(0, 20)}`;
  
  const exists = await prisma.quickMeeting.findFirst({
    where: { sourceId, userId: USER_ID }
  });
  
  if (exists) {
    throw new Error('Già esistente');
  }
  
  const meeting = await prisma.quickMeeting.create({
    data: {
      title: data.title,
      description: data.title,
      category: 'CENTRO_MASSAGGI',
      city: CITY.toUpperCase(),
      photos: data.photo ? [data.photo] : [],
      sourceUrl,
      sourceId,
      userId: USER_ID,
      isActive: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });
  
  return meeting;
}

async function runOnce() {
  console.log(`🤖 Bot Bakeca Massaggi RUN`);
  console.log(`📊 Parametri: USER_ID=${USER_ID}, CITY=${CITY}, LIMIT=${LIMIT}`);

  const maxAds = LIMIT > 0 ? LIMIT : Number.MAX_SAFE_INTEGER;
  const maxPages = 50;

  async function collectAllPages(baseUrl) {
    const all = [];

    for (let page = 1; page <= maxPages && all.length < maxAds; page++) {
      const pageUrl = page === 1 ? baseUrl : `${baseUrl}?page=${page}`;
      console.log(`📄 Pagina massaggi ${page}: ${pageUrl}`);

      const pageItems = await scrapeLista(pageUrl);

      if (!pageItems || pageItems.length === 0) {
        if (page === 1) {
          console.log(`⚠️ Nessun annuncio trovato a pagina ${page}`);
        } else {
          console.log(`ℹ️ Nessun annuncio aggiuntivo a pagina ${page}, stop paginazione`);
        }
        break;
      }

      for (const it of pageItems) {
        if (!all.find(x => x.href === it.href) && all.length < maxAds) {
          all.push(it);
        }
      }
    }

    return all;
  }

  const cityUrl = `https://www.bakeca.it/annunci/massaggi-benessere/${CITY.toLowerCase()}/`;

  let items = await collectAllPages(cityUrl);
  if (!items || items.length === 0) {
    console.log(`⚠️ Nessun annuncio trovato con città, provo senza città...`);
    items = await collectAllPages('https://www.bakeca.it/annunci/massaggi-benessere/');
  }

  if (!items || items.length === 0) {
    console.error(`❌ Nessun annuncio trovato`);
    return;
  }

  let imported = 0;
  let skipped = 0;

  for (const it of items.slice(0, LIMIT)) {
    try {
      await salvaAnnuncio(it, it.href);
      imported++;
      console.log(`✅ Importato: ${it.title.substring(0, 50)}...`);
    } catch (error) {
      if (error.message === 'Già esistente') {
        console.log(`⏭️ Skip: già esistente`);
      } else {
        console.error(`❌ Errore:`, error.message);
      }
      skipped++;
    }
  }

  console.log(`\n🎉 RUN COMPLETATA`);
  console.log(`📊 Importati: ${imported}`);
  console.log(`⏭️ Saltati: ${skipped}`);
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
