const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const prisma = new PrismaClient();

class ScraperRobusto {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    console.log('🚀 Inizializzazione browser (modalità robusta)...');
    this.browser = await puppeteer.launch({ 
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ],
      ignoreHTTPSErrors: true
    });
    
    const pages = await this.browser.pages();
    this.page = pages[0] || await this.browser.newPage();
    
    // Anti-detection
    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['it-IT', 'it', 'en-US', 'en'] });
    });
    
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await this.page.setViewport({ width: 1920, height: 1080 });
    await this.page.setDefaultNavigationTimeout(90000);
  }

  async navigateWithRetry(url, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`📖 Tentativo ${i + 1}/${maxRetries}: ${url}`);
        
        const response = await this.page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: 60000 
        });
        
        await sleep(5000); // Aspetta caricamento JavaScript
        
        const finalUrl = this.page.url();
        console.log(`✅ Pagina caricata: ${finalUrl}`);
        
        if (finalUrl.includes('about:blank')) {
          console.log('⚠️ Pagina vuota, riprovo...');
          continue;
        }
        
        return true;
      } catch (error) {
        console.log(`❌ Errore tentativo ${i + 1}: ${error.message}`);
        if (i < maxRetries - 1) {
          await sleep(3000);
        }
      }
    }
    return false;
  }

  async acceptCookies() {
    try {
      const selectors = [
        'button:has-text("Accetta")',
        'button:has-text("Accept")',
        '[class*="accept"]',
        '[id*="accept"]'
      ];

      for (const selector of selectors) {
        try {
          const el = await this.page.$(selector);
          if (el) {
            await el.click();
            console.log('✅ Cookie accettati');
            await sleep(2000);
            return true;
          }
        } catch (e) {}
      }
    } catch (e) {
      console.log('ℹ️ Nessun banner cookie trovato');
    }
    return false;
  }

  async extractAnnunci() {
    try {
      // Screenshot per debug
      const debugDir = path.join(__dirname, 'debug');
      if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
      const screenshotPath = path.join(debugDir, `page_${Date.now()}.png`);
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`📸 Screenshot: ${screenshotPath}`);

      // Estrai TUTTO dal DOM
      const pageData = await this.page.evaluate(() => {
        const data = {
          url: window.location.href,
          title: document.title,
          links: [],
          images: [],
          textContent: document.body ? document.body.innerText.slice(0, 500) : ''
        };

        // Cerca tutti i link con immagini (probabile annuncio)
        document.querySelectorAll('a[href]').forEach(link => {
          const img = link.querySelector('img');
          const text = link.textContent.trim();
          
          if (img && text.length > 10) {
            data.links.push({
              href: link.href,
              text: text.slice(0, 100),
              imgSrc: img.src || img.getAttribute('data-src') || ''
            });
          }
        });

        // Cerca tutte le immagini
        document.querySelectorAll('img').forEach(img => {
          data.images.push(img.src || img.getAttribute('data-src') || '');
        });

        return data;
      });

      console.log(`📊 URL finale: ${pageData.url}`);
      console.log(`📊 Titolo: ${pageData.title}`);
      console.log(`📊 Link trovati: ${pageData.links.length}`);
      console.log(`📊 Immagini trovate: ${pageData.images.length}`);
      
      if (pageData.links.length > 0) {
        console.log('\n📋 Primi 5 annunci:');
        pageData.links.slice(0, 5).forEach((link, i) => {
          console.log(`  ${i + 1}. ${link.text}`);
          console.log(`     ${link.href}`);
        });
      } else {
        console.log('\n⚠️ NESSUN ANNUNCIO TROVATO');
        console.log('📄 Primi 500 caratteri pagina:');
        console.log(pageData.textContent);
      }

      return pageData.links;
    } catch (error) {
      console.error(`❌ Errore estrazione: ${error.message}`);
      return [];
    }
  }

  async scrapeDetailPage(url, category, city) {
    try {
      await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await sleep(2000);

      const details = await this.page.evaluate(() => {
        // Titolo
        const titleEl = document.querySelector('h1, .title, [class*="title"]');
        const title = titleEl ? titleEl.textContent.trim() : '';

        // Descrizione
        const descEl = document.querySelector('.description, [class*="desc"], .text, p');
        const description = descEl ? descEl.textContent.trim() : '';

        // Telefono
        let phone = null;
        const phoneEl = document.querySelector('a[href^="tel:"], .phone, [class*="phone"], [class*="telefono"]');
        if (phoneEl) {
          const phoneText = phoneEl.textContent || phoneEl.href;
          const phoneMatch = phoneText.match(/[\d\s\+\-\(\)]{9,}/);
          if (phoneMatch) phone = phoneMatch[0].trim();
        }

        // WhatsApp
        let whatsapp = null;
        const waEl = document.querySelector('a[href*="wa.me"], a[href*="whatsapp"]');
        if (waEl && waEl.href) {
          const waMatch = waEl.href.match(/(?:wa\.me\/|phone=)(\d+)/);
          if (waMatch) whatsapp = `https://wa.me/${waMatch[1]}`;
        }

        // Età
        let age = null;
        const ageText = document.body.textContent;
        const ageMatch = ageText.match(/(\d{2})\s*anni|età\s*(\d{2})/i);
        if (ageMatch) age = parseInt(ageMatch[1] || ageMatch[2]);

        // Prezzo
        let price = null;
        const priceEl = document.querySelector('.price, [class*="price"], [class*="prezzo"]');
        if (priceEl) {
          const priceText = priceEl.textContent;
          const priceMatch = priceText.match(/(\d+)/);
          if (priceMatch) price = parseInt(priceMatch[1]);
        }

        // Zona
        let zone = null;
        const zoneEl = document.querySelector('.location, .zone, [class*="zona"], [class*="location"]');
        if (zoneEl) zone = zoneEl.textContent.trim();

        // Tutte le foto
        const photos = [];
        document.querySelectorAll('img').forEach(img => {
          const src = img.src || img.getAttribute('data-src');
          if (src && (src.includes('bakeca') || src.includes('http')) && !src.includes('logo') && !photos.includes(src)) {
            photos.push(src);
          }
        });

        return { title, description, phone, whatsapp, age, price, zone, photos };
      });

      return details;
    } catch (error) {
      console.error(`❌ Errore dettaglio: ${error.message}`);
      return null;
    }
  }

  async saveAnnunci(links, category, city) {
    const saved = [];
    const limit = Math.min(links.length, 20);
    
    console.log(`\n📥 Inizio scraping dettagli (${limit} annunci)...\n`);
    
    for (let i = 0; i < limit; i++) {
      const link = links[i];
      try {
        console.log(`[${i+1}/${limit}] 🔍 ${link.href.slice(0, 70)}...`);
        
        const sourceId = `bkc_${category}_${Buffer.from(link.href).toString('base64').slice(0, 20)}`;
        
        const existing = await prisma.quickMeeting.findFirst({
          where: { sourceId }
        });

        if (existing) {
          console.log(`   ⏭️ Già esistente\n`);
          continue;
        }

        // Visita dettaglio
        const details = await this.scrapeDetailPage(link.href, category, city);
        
        if (!details || !details.title || details.title.length < 3) {
          console.log(`   ⚠️ Dati insufficienti, salto\n`);
          continue;
        }

        const ad = await prisma.quickMeeting.create({
          data: {
            title: details.title,
            description: details.description || details.title,
            category: category,
            city: city.toUpperCase(),
            zone: details.zone,
            phone: details.phone,
            whatsapp: details.whatsapp,
            age: details.age,
            price: details.price,
            photos: details.photos.length > 0 ? details.photos : [],
            sourceUrl: link.href,
            sourceId,
            userId: null,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        });
        
        saved.push(ad);
        console.log(`   ✅ Salvato: "${details.title.slice(0, 40)}"`);
        console.log(`   📞 ${details.phone || 'N/A'} | 🎂 ${details.age || 'N/A'} | 💰 ${details.price || 'N/A'}€`);
        console.log(`   📸 ${details.photos.length} foto\n`);
        
        await sleep(1500 + Math.random() * 1500);
        
      } catch (error) {
        console.error(`   ❌ Errore: ${error.message}\n`);
      }
    }
    
    return saved;
  }

  async assignBumpPackages() {
    try {
      console.log('\n🎯 Assegnando pacchetti bump...');
      
      const ads = await prisma.quickMeeting.findMany({
        where: { bumpPackage: null, isActive: true },
        take: 100
      });

      const packages = ['1+1', '1+3', '1+7', '1x10', '1x3'];
      const timeSlots = [
        '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
        '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00',
        '16:00-17:00', '17:00-18:00', '18:00-19:00', '19:00-20:00',
        '20:00-21:00', '21:00-22:00', '22:00-23:00', '23:00-00:00'
      ];

      for (const ad of ads) {
        const pkg = packages[Math.floor(Math.random() * packages.length)];
        const slot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
        
        let maxBumps = 0;
        let nextBumpAt = new Date();

        if (pkg === '1+1') maxBumps = 2;
        else if (pkg === '1+3') maxBumps = 4;
        else if (pkg === '1+7') maxBumps = 8;
        else if (pkg === '1x10') maxBumps = 10;
        else if (pkg === '1x3') maxBumps = 3;

        if (pkg.includes('x')) {
          nextBumpAt.setHours(0, 0, 0, 0);
        } else {
          nextBumpAt.setHours(parseInt(slot.split(':')[0]), 0, 0, 0);
        }

        await prisma.quickMeeting.update({
          where: { id: ad.id },
          data: {
            bumpPackage: pkg,
            bumpTimeSlot: pkg.includes('x') ? '00:00-08:00' : slot,
            maxBumps,
            nextBumpAt
          }
        });

        console.log(`🎯 ${ad.title.slice(0, 40)}: ${pkg} alle ${slot}`);
      }

      console.log('✅ Pacchetti assegnati');
    } catch (error) {
      console.error(`❌ Errore bump: ${error.message}`);
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
    await prisma.$disconnect();
  }
}

async function main() {
  const scraper = new ScraperRobusto();
  
  try {
    await scraper.init();
    
    // Test bakecaincontrii.com/escort/
    console.log('\n🏙️ === BAKECAINCONTRII /escort/ ===');
    const success = await scraper.navigateWithRetry('https://www.bakecaincontrii.com/escort/');
    
    if (success) {
      await scraper.acceptCookies();
      
      // Scroll
      await scraper.page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
      });
      await sleep(3000);
      
      const links = await scraper.extractAnnunci();
      await scraper.saveAnnunci(links, 'DONNA_CERCA_UOMO', 'milano');
    } else {
      console.log('❌ Impossibile caricare bakecaincontrii.com');
      console.log('📝 Il sito potrebbe richiedere interazione manuale o avere protezioni anti-bot');
    }
    
    // Bakeca.it Centro Massaggi
    console.log('\n🏙️ === BAKECA.IT Centro Massaggi ===');
    const success2 = await scraper.navigateWithRetry('https://www.bakeca.it/annunci/massaggi-benessere/milano/');
    
    if (success2) {
      await scraper.acceptCookies();
      await scraper.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await sleep(3000);
      
      const links2 = await scraper.extractAnnunci();
      await scraper.saveAnnunci(links2, 'CENTRO_MASSAGGI', 'milano');
    }
    
    await scraper.assignBumpPackages();
    
    console.log('\n🎉 COMPLETATO!');
    console.log('✅ Verifica: http://localhost:3000/incontri-veloci');
    console.log('✅ DB: npx prisma studio → QuickMeeting');
    console.log('✅ Screenshot: scripts/debug/');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    console.log('\n⏸️ Browser aperto per ispezione. Chiudi manualmente quando hai finito.');
    // Non chiudo il browser per permettere ispezione
    // await scraper.close();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ScraperRobusto;
