const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const prisma = new PrismaClient();

/**
 * SCRAPER FINALE - Estrae dalla LISTA per evitare captcha
 * Bakeca.it massaggi Milano
 */

async function scrapeBakecaMassaggi() {
  let browser;
  
  try {
    console.log('🚀 Avvio scraper Bakeca Massaggi...\n');
    
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // Vai alla lista Milano massaggi
    console.log('📖 Carico lista annunci...');
    await page.goto('https://www.bakeca.it/annunci/massaggi-benessere/milano/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    await sleep(3000);
    
    // Accetta cookie
    try {
      await page.click('button[class*="accept"]', { timeout: 5000 });
      await sleep(1000);
    } catch (e) {}
    
    // Scroll
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await sleep(2000);
    
    // Estrai DALLA LISTA (senza visitare dettagli)
    console.log('📥 Estrazione annunci dalla lista...\n');
    
    const ads = await page.evaluate(() => {
      const results = [];
      
      // Cerca tutti i container annunci
      const cards = document.querySelectorAll('[class*="list-item"], [class*="item"], article, li');
      
      cards.forEach(card => {
        try {
          // Link
          const link = card.querySelector('a[href*="/dettaglio/"]');
          if (!link) return;
          
          // Titolo
          const titleEl = card.querySelector('h2, h3, [class*="title"]');
          const title = titleEl ? titleEl.textContent.trim() : '';
          
          // Descrizione
          const descEl = card.querySelector('p, [class*="desc"], [class*="text"]');
          const description = descEl ? descEl.textContent.trim() : '';
          
          // Immagine
          const img = card.querySelector('img');
          const imgSrc = img ? (img.src || img.getAttribute('data-src') || '') : '';
          
          // Città (dal link)
          const cityMatch = link.href.match(/https:\/\/(\w+)\.bakeca\.it/);
          const city = cityMatch ? cityMatch[1].toUpperCase() : 'MILANO';
          
          // Zona (se presente nel testo)
          let zone = null;
          const zoneEl = card.querySelector('[class*="location"], [class*="zona"]');
          if (zoneEl) zone = zoneEl.textContent.trim();
          
          if (title && title.length > 5 && link.href.includes('bakeca')) {
            results.push({
              title,
              description: description || title,
              href: link.href,
              imgSrc,
              city,
              zone
            });
          }
        } catch (e) {
          console.error('Errore parsing card:', e);
        }
      });
      
      return results;
    });
    
    console.log(`✅ Trovati ${ads.length} annunci\n`);
    
    if (ads.length === 0) {
      console.log('⚠️ Nessun annuncio trovato. Selettori potrebbero essere cambiati.');
      await page.screenshot({ path: 'debug-no-ads.png', fullPage: true });
      console.log('📸 Screenshot salvato: debug-no-ads.png');
    }
    
    // Salva in database
    let saved = 0;
    let skipped = 0;
    
    for (const ad of ads.slice(0, 30)) {
      try {
        const sourceId = `bkc_massaggi_${Buffer.from(ad.href).toString('base64').slice(0, 20)}`;
        
        const existing = await prisma.quickMeeting.findFirst({
          where: { sourceId }
        });
        
        if (existing) {
          skipped++;
          continue;
        }
        
        await prisma.quickMeeting.create({
          data: {
            title: ad.title,
            description: ad.description,
            category: 'CENTRO_MASSAGGI',
            city: ad.city,
            zone: ad.zone,
            photos: ad.imgSrc ? [ad.imgSrc] : [],
            sourceUrl: ad.href,
            sourceId,
            userId: null, // Bot import
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        });
        
        saved++;
        console.log(`💾 [${saved}] ${ad.title.slice(0, 50)}...`);
        
      } catch (error) {
        console.error(`❌ Errore salvataggio: ${error.message}`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`✅ Completato!`);
    console.log(`   • Salvati: ${saved}`);
    console.log(`   • Saltati (esistenti): ${skipped}`);
    console.log('='.repeat(60));
    
    // Statistiche
    const total = await prisma.quickMeeting.count();
    const botImported = await prisma.quickMeeting.count({ where: { userId: null } });
    const manualCreated = await prisma.quickMeeting.count({ where: { userId: { not: null } } });
    
    console.log(`\n📊 Database:`);
    console.log(`   • Totale annunci: ${total}`);
    console.log(`   • Importati da bot: ${botImported}`);
    console.log(`   • Creati manualmente: ${manualCreated}`);
    
    console.log('\n🌐 Verifica su: http://localhost:3001/incontri-veloci');
    
    await sleep(5000);
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    if (browser) await browser.close();
    await prisma.$disconnect();
  }
}

scrapeBakecaMassaggi();
