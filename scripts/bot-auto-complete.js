/**
 * Bot Automatico Completo - Importa TUTTI gli annunci da TUTTE le categorie e città
 * 
 * Uso: USER_ID=1 node scripts/bot-auto-complete.js
 * 
 * Cosa fa:
 * - Cicla tutte le categorie (DONNA_CERCA_UOMO, TRANS, UOMO_CERCA_UOMO, CENTRO_MASSAGGI)
 * - Cicla tutte le città principali italiane
 * - Per ogni combinazione importa annunci
 * - Li pubblica automaticamente tramite API
 */

const { PrismaClient } = require('@prisma/client');
const puppeteer = require('puppeteer');

const prisma = new PrismaClient();

const USER_ID = process.env.USER_ID ? parseInt(process.env.USER_ID, 10) : null;
const LIMIT_PER_CITY = parseInt(process.env.LIMIT || '10', 10);

if (!USER_ID) {
  console.error('❌ USER_ID richiesto. Esempio: USER_ID=1 node scripts/bot-auto-complete.js');
  process.exit(1);
}

// Prova più pattern di URL per bakecaincontrii e torna i link del primo che funziona
async function scrapeListaSmart(city, category) {
  const citySub = toSubdomain(city);
  const catPath = CATEGORY_URLS[category];
  const candidates = [
    `https://${citySub}.bakecaincontrii.com/${catPath}/`,
    `https://www.bakecaincontrii.com/${catPath}/${citySub}/`,
    `https://www.bakecaincontrii.com/${citySub}/${catPath}/`,
    `https://www.bakecaincontrii.com/${catPath}-${citySub}/`
  ];

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors']
  });
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    for (const target of candidates) {
      try {
        await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await new Promise(r => setTimeout(r, 2500));
        // tenta un piccolo scroll per attivare caricamenti lazy
        await page.evaluate(async () => {
          window.scrollTo(0, document.body.scrollHeight);
          await new Promise(r => setTimeout(r, 800));
        });

        const baseDomain = '.bakecaincontrii.com';
        const links = await page.evaluate((listUrl, baseDomain) => {
          const origin = window.location.origin;
          const results = [];
          const anchors = document.querySelectorAll('a[href]');
          anchors.forEach(a => {
            let href = a.getAttribute('href');
            if (!href) return;
            if (!href.startsWith('http')) {
              href = href.startsWith('/') ? `${origin}${href}` : `${origin}/${href}`;
            }
            try {
              const u = new URL(href);
              // accetta stesso dominio base bakecaincontrii.com
              if (!u.hostname.endsWith(baseDomain)) return;
              if (u.pathname.includes('/tag/')) return;
              if (/\.(jpg|jpeg|png|gif|webp|svg|css|js)$/i.test(u.pathname)) return;
              const cleanPath = u.pathname.replace(/\/+$/, '');
              const segs = cleanPath.split('/').filter(Boolean);
              if (segs.length >= 2 && !results.includes(href)) results.push(href);
            } catch (e) {}
          });
          return results;
        }, target, baseDomain);

        if (links && links.length > 0) {
          console.log(`🔎 Lista trovata su: ${target} (${links.length} link)`);
          return links;
        }
      } catch (e) {
        // prova prossimo pattern
      }
    }
    return [];
  } finally {
    await browser.close();
  }
}

// Tutte le categorie
const CATEGORIES = ['DONNA_CERCA_UOMO', 'TRANS', 'UOMO_CERCA_UOMO'];

// Città principali italiane
const CITIES = [
  'Milano', 'Roma', 'Napoli', 'Torino', 'Palermo', 'Genova', 
  'Bologna', 'Firenze', 'Bari', 'Catania', 'Venezia', 'Verona',
  'Messina', 'Padova', 'Trieste', 'Brescia', 'Parma', 'Prato',
  'Modena', 'Reggio Calabria', 'Reggio Emilia', 'Perugia', 'Livorno',
  'Cagliari', 'Foggia', 'Rimini', 'Salerno', 'Ferrara', 'Sassari',
  'Latina', 'Giugliano', 'Monza', 'Siracusa', 'Pescara', 'Bergamo'
];

const CATEGORY_URLS = {
  DONNA_CERCA_UOMO: 'donna-cerca-uomo',
  TRANS: 'trans',
  UOMO_CERCA_UOMO: 'uomo-cerca-uomo'
};

// Mappa correzioni sottodominio per città composte/accents
const CITY_SUBDOMAIN_MAP = {
  'Reggio Calabria': 'reggiocalabria',
  'Reggio Emilia': 'reggioemilia',
  'La Spezia': 'laspezia',
  'Castellammare di Stabia': 'castellammaredistabia'
}

function toSubdomain(city) {
  if (CITY_SUBDOMAIN_MAP[city]) return CITY_SUBDOMAIN_MAP[city]
  return city
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9-]/g, '')
}

function buildUrl(city, category) {
  // Struttura: {città}.bakecaincontrii.com/{categoria}/
  return `https://${toSubdomain(city)}.bakecaincontrii.com/${CATEGORY_URLS[category]}/`;
}

async function scrapeLista(url) {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors']
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const links = await page.evaluate((listUrl) => {
      const results = [];
      const anchors = document.querySelectorAll('a[href]');
      const origin = window.location.origin;
      const categoryPath = new URL(listUrl).pathname.replace(/\/+$/, '');
      
      anchors.forEach(a => {
        let href = a.getAttribute('href');
        if (!href) return;
        
        if (!href.startsWith('http')) {
          href = href.startsWith('/') ? `${origin}${href}` : `${origin}/${href}`;
        }
        
        try {
          const u = new URL(href);
          if (u.origin !== origin) return; // stesso dominio/città
          if (u.pathname.includes('/tag/')) return; // escludi tag
          if (/\.(jpg|jpeg|png|gif|webp|svg|css|js)$/i.test(u.pathname)) return;
          const cleanPath = u.pathname.replace(/\/+$/, '');
          if (cleanPath === categoryPath) return; // escludi pagina categoria
          const segs = cleanPath.split('/').filter(Boolean);
          if (segs.length >= 2 && !results.includes(href)) {
            results.push(href);
          }
        } catch (e) {}
      });
      
      return results;
    }, url);
    
    return links;
    
  } finally {
    await browser.close();
  }
}

async function scrapeDettaglio(url) {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors']
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const data = await page.evaluate(() => {
      const title = (document.querySelector('h1')?.textContent || 
                     document.querySelector('[class*="title"]')?.textContent || '').trim();
      
      const description = (document.querySelector('[class*="description"]')?.textContent || 
                          document.querySelector('article')?.textContent || 
                          document.querySelector('p')?.textContent || '').trim();
      
      let tel = null;
      const telLink = document.querySelector('a[href^="tel:"]');
      if (telLink) tel = telLink.getAttribute('href').replace('tel:', '').trim();
      
      let wa = null;
      const waLink = document.querySelector('a[href*="wa.me"], a[href*="whatsapp"]');
      if (waLink) wa = waLink.getAttribute('href');
      
      let age = null;
      const bodyText = document.body.textContent || '';
      const match = bodyText.match(/(\d{2})\s*anni|età\s*(\d{2})/i);
      if (match) age = parseInt(match[1] || match[2], 10);
      
      const photos = [];
      document.querySelectorAll('img').forEach(img => {
        const src = img.getAttribute('src') || img.getAttribute('data-src');
        if (src && src.startsWith('http') && !/logo|sprite|icon/i.test(src) && !photos.includes(src)) {
          photos.push(src);
        }
      });
      
      return { title, description, tel, wa, age, photos, bodyText };
    });
    
    // Post-process telefono con fallback da whatsapp/testo
    let phone = data.tel;
    if (!phone && data.wa) {
      const digits = data.wa.replace(/\D/g, '');
      if (digits.length >= 9) phone = digits;
    }
    if (!phone) {
      const candidates = (data.bodyText || '').match(/[+]?3?9?[\s\-.()]*\d[\d\s\-.()]{7,15}/g);
      if (candidates) {
        for (const c of candidates) {
          const d = c.replace(/\D/g, '');
          if (d.length >= 9 && d.length <= 13) { phone = d; break; }
        }
      }
    }
    
    return { title: data.title, description: data.description, phone, whatsapp: data.wa || null, age: data.age || null, photos: data.photos };
    
  } finally {
    await browser.close();
  }
}

async function salvaAnnuncio(data, sourceUrl, category, city) {
  const sourceId = `bot_${category}_${Buffer.from(sourceUrl).toString('base64').slice(0, 20)}`;
  
  // Controlla se esiste già
  const exists = await prisma.quickMeeting.findFirst({
    where: { sourceId, userId: USER_ID }
  });
  
  if (exists) {
    throw new Error('Già esistente');
  }
  
  // Telefono obbligatorio: skip se assente o troppo corto
  if (!data.phone || String(data.phone).replace(/\D/g, '').length < 9) {
    throw new Error('Senza telefono (skip)');
  }

  // Salva nuovo annuncio
  const meeting = await prisma.quickMeeting.create({
    data: {
      title: (data.title || 'Annuncio').slice(0,120),
      description: data.description || data.title,
      category,
      city: city.toUpperCase(),
      phone: String(data.phone),
      whatsapp: data.whatsapp || null,
      age: data.age || null,
      photos: data.photos || [],
      sourceUrl,
      sourceId,
      userId: USER_ID,
      isActive: true, // Pubblicato automaticamente
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });
  
  return meeting;
}

async function processCategory(category, city) {
  console.log(`\n📂 Categoria: ${category} | 🌍 Città: ${city}`);
  
  if (!CATEGORY_URLS[category]) return { imported: 0, skipped: 0 };
  
  const url = buildUrl(city, category);
  
  try {
    console.log(`📄 Scarico lista da: ${url}`);
    let links = await scrapeLista(url);
    if (!links || links.length === 0) {
      // fallback su pattern alternativi
      links = await scrapeListaSmart(city, category);
    }
    
    if (!links || links.length === 0) {
      console.log(`❌ Nessun annuncio trovato`);
      return { imported: 0, skipped: 0 };
    }
    
    console.log(`✅ Trovati ${links.length} link`);
    
    let imported = 0;
    let skipped = 0;
    
    for (const href of links.slice(0, LIMIT_PER_CITY)) {
      try {
        const d = await scrapeDettaglio(href);
        
        if (!d.title || d.title.length < 5) {
          skipped++;
          continue;
        }
        
        if (!d.photos || d.photos.length === 0) {
          skipped++;
          continue;
        }
        if (!d.phone) { // telefono obbligatorio
          skipped++;
          continue;
        }
        
        await salvaAnnuncio(d, href, category, city);
        
        imported++;
        console.log(`✅ ${d.title.substring(0, 60)}... (${d.phone})`);
        
      } catch (error) {
        if (error.message === 'Già esistente') {
          // Skip silenzioso
        } else {
          console.error(`❌ Errore: ${error.message}`);
        }
        skipped++;
      }
    }
    
    return { imported, skipped };
    
  } catch (error) {
    console.error(`❌ Errore categoria ${category}/${city}:`, error.message);
    return { imported: 0, skipped: 0 };
  }
}

async function processCentroMassaggi(city) {
  console.log(`\n📂 Categoria: CENTRO_MASSAGGI | 🌍 Città: ${city}`);
  
  const url = `https://www.bakeca.it/annunci/massaggi-benessere/${city.toLowerCase()}/`;
  
  try {
    console.log(`📄 Scarico lista...`);
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const items = await page.evaluate(() => {
      const results = [];
      const links = document.querySelectorAll('a[href*="/dettaglio/"]');
      
      links.forEach(a => {
        const href = a.getAttribute('href');
        if (!href) return;
        
        const full = href.startsWith('http') ? href : `https://www.bakeca.it${href}`;
        
        const parent = a.closest('article, li, .item, .list-item');
        const title = parent?.querySelector('h2, h3, .title')?.textContent?.trim() || 'Annuncio massaggi';
        const img = parent?.querySelector('img')?.getAttribute('src') || 
                   parent?.querySelector('img')?.getAttribute('data-src');
        
        if (!results.find(r => r.href === full)) {
          results.push({ href: full, title, photo: img });
        }
      });
      
      return results;
    });
    
    await browser.close();
    
    console.log(`✅ Trovati ${items.length} annunci`);
    
    let imported = 0;
    let skipped = 0;
    
    for (const it of items.slice(0, LIMIT_PER_CITY)) {
      try {
        const sourceId = `bot_CENTRO_MASSAGGI_${Buffer.from(it.href).toString('base64').slice(0, 20)}`;
        
        const exists = await prisma.quickMeeting.findFirst({
          where: { sourceId, userId: USER_ID }
        });
        
        if (exists) {
          skipped++;
          continue;
        }
        
        await prisma.quickMeeting.create({
          data: {
            title: it.title,
            description: it.title,
            category: 'CENTRO_MASSAGGI',
            city: city.toUpperCase(),
            photos: it.photo ? [it.photo] : [],
            sourceUrl: it.href,
            sourceId,
            userId: USER_ID,
            isActive: true,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        });
        
        imported++;
        console.log(`✅ ${it.title.substring(0, 40)}...`);
        
      } catch (error) {
        skipped++;
      }
    }
    
    return { imported, skipped };
    
  } catch (error) {
    console.error(`❌ Errore CENTRO_MASSAGGI/${city}:`, error.message);
    return { imported: 0, skipped: 0 };
  }
}

async function main() {
  console.log(`🤖 BOT AUTOMATICO COMPLETO START`);
  console.log(`📊 USER_ID: ${USER_ID}`);
  console.log(`📊 Limite per città: ${LIMIT_PER_CITY}`);
  console.log(`📊 Categorie: ${CATEGORIES.length + 1} (+ Centro Massaggi)`);
  console.log(`📊 Città: ${CITIES.length}`);
  console.log(`📊 Totale combinazioni: ${(CATEGORIES.length + 1) * CITIES.length}\n`);
  
  const stats = {
    totalImported: 0,
    totalSkipped: 0,
    byCategory: {}
  };
  
  // Bakecaincontri (DONNA_CERCA_UOMO, TRANS, UOMO_CERCA_UOMO)
  for (const category of CATEGORIES) {
    stats.byCategory[category] = { imported: 0, skipped: 0 };
    
    for (const city of CITIES) {
      const result = await processCategory(category, city);
      stats.totalImported += result.imported;
      stats.totalSkipped += result.skipped;
      stats.byCategory[category].imported += result.imported;
      stats.byCategory[category].skipped += result.skipped;
    }
  }
  
  // Centro Massaggi (Bakeca)
  stats.byCategory['CENTRO_MASSAGGI'] = { imported: 0, skipped: 0 };
  
  for (const city of CITIES) {
    const result = await processCentroMassaggi(city);
    stats.totalImported += result.imported;
    stats.totalSkipped += result.skipped;
    stats.byCategory['CENTRO_MASSAGGI'].imported += result.imported;
    stats.byCategory['CENTRO_MASSAGGI'].skipped += result.skipped;
  }
  
  await prisma.$disconnect();
  
  console.log(`\n\n🎉 COMPLETATO!`);
  console.log(`\n📊 STATISTICHE FINALI:`);
  console.log(`✅ Totale importati: ${stats.totalImported}`);
  console.log(`⏭️ Totale saltati: ${stats.totalSkipped}`);
  console.log(`\n📂 Per categoria:`);
  
  for (const [cat, s] of Object.entries(stats.byCategory)) {
    console.log(`   ${cat}: ${s.imported} importati, ${s.skipped} saltati`);
  }
  
  console.log(`\n👉 Vai su /dashboard/incontri-veloci per vedere tutti gli annunci!`);
}

main().catch(async (err) => {
  console.error('❌ Errore fatale:', err);
  await prisma.$disconnect();
  process.exit(1);
});
