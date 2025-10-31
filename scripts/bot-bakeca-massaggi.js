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

async function main() {
  console.log(`🤖 Bot Bakeca Massaggi START`);
  console.log(`📊 Parametri: USER_ID=${USER_ID}, CITY=${CITY}, LIMIT=${LIMIT}`);
  
  const url = `https://www.bakeca.it/annunci/massaggi-benessere/${CITY.toLowerCase()}/`;
  
  let items = await scrapeLista(url);
  if (!items || items.length === 0) {
    console.log(`⚠️ Nessun annuncio trovato con città, provo senza città...`);
    items = await scrapeLista('https://www.bakeca.it/annunci/massaggi-benessere/');
  }
  
  if (!items || items.length === 0) {
    console.error(`❌ Nessun annuncio trovato`);
    await prisma.$disconnect();
    process.exit(1);
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
