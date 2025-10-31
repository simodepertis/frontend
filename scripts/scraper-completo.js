const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const prisma = new PrismaClient();

class ScraperCompleto {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    console.log('🚀 Inizializzazione browser...');
    this.browser = await puppeteer.launch({ 
      headless: false, // Browser visibile
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled'
      ]
    });
    this.page = await this.browser.newPage();
    
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });
  }

  async acceptCookies() {
    const selectors = [
      'button:has-text("Accetta")',
      'button:has-text("Accept")',
      'button[id*="accept"]',
      '.iubenda-cs-accept-btn',
      '#iubenda-cs-banner button',
      '.cookie-accept'
    ];

    for (const selector of selectors) {
      try {
        await this.page.waitForSelector(selector, { timeout: 2000 });
        await this.page.click(selector);
        console.log('✅ Cookie accettati');
        await sleep(1000);
        return true;
      } catch (e) {}
    }
    return false;
  }

  async tryMultipleUrls(baseUrls, path) {
    for (const base of baseUrls) {
      const url = `${base}${path}`;
      try {
        console.log(`🔍 Provo: ${url}`);
        const response = await this.page.goto(url, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });
        
        if (response.status() === 200) {
          console.log(`✅ URL funzionante: ${url}`);
          return url;
        }
      } catch (e) {
        console.log(`❌ ${url} non funziona`);
      }
    }
    return null;
  }

  async scrapeAnnunci(url, category, city) {
    try {
      console.log(`\n📖 Navigando: ${url}`);
      
      if (!url.includes('http')) {
        await this.page.goto(url, { 
          waitUntil: 'networkidle2',
          timeout: 60000 
        });
      }
      
      await sleep(3000);
      await this.acceptCookies();
      await sleep(2000);

      // Scroll
      await this.page.evaluate(async () => {
        await new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 300;
          const timer = setInterval(() => {
            window.scrollBy(0, distance);
            totalHeight += distance;
            if(totalHeight >= document.body.scrollHeight - window.innerHeight){
              clearInterval(timer);
              resolve();
            }
          }, 200);
        });
      });
      
      await this.page.evaluate(() => window.scrollTo(0, 0));
      await sleep(1000);

      // Screenshot
      const debugDir = path.join(__dirname, 'debug');
      if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
      const screenshotPath = path.join(debugDir, `${city}_${category}_${Date.now()}.png`);
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`📸 Screenshot: ${screenshotPath}`);

      // Estrai annunci
      const ads = await this.page.evaluate(() => {
        const results = [];
        
        // Selettori multipli per bakecaincontri/bakeka
        const possibleSelectors = [
          '.annuncio',
          '.ad-item',
          '.listing-item',
          '.card',
          '.searchResultListItem',
          '.risultato',
          'li[data-id]',
          'article',
          'div[itemtype*="Product"]',
          '.AdElement'
        ];

        let elements = [];
        for (const sel of possibleSelectors) {
          const found = document.querySelectorAll(sel);
          if (found.length > 0) {
            elements = Array.from(found);
            console.log(`Trovati ${found.length} con selettore: ${sel}`);
            break;
          }
        }

        // Fallback: link con immagini
        if (elements.length === 0) {
          const allLinks = document.querySelectorAll('a[href]');
          allLinks.forEach(link => {
            const img = link.querySelector('img');
            if (img && link.textContent.trim().length > 15) {
              elements.push(link);
            }
          });
        }

        elements.forEach((el, idx) => {
          try {
            const titleEl = el.querySelector('h2, h3, h4, .title, .titolo, [class*="title"]');
            const title = titleEl ? titleEl.textContent.trim() : el.textContent.trim().slice(0, 80);
            
            const linkEl = el.tagName === 'A' ? el : el.querySelector('a[href]');
            const href = linkEl ? linkEl.href : '';
            
            const imgEl = el.querySelector('img');
            const imgSrc = imgEl ? (imgEl.src || imgEl.getAttribute('data-src') || imgEl.getAttribute('data-original')) : '';
            
            const descEl = el.querySelector('.description, .desc, p, [class*="desc"]');
            const description = descEl ? descEl.textContent.trim() : '';
            
            const priceEl = el.querySelector('.price, .prezzo, [class*="price"]');
            let price = null;
            if (priceEl) {
              const priceText = priceEl.textContent.replace(/[^0-9]/g, '');
              price = priceText ? parseInt(priceText) : null;
            }
            
            const locEl = el.querySelector('.location, .zona, .località, [class*="location"]');
            const location = locEl ? locEl.textContent.trim() : '';

            const phoneEl = el.querySelector('[href^="tel:"], .phone, .telefono');
            const phone = phoneEl ? phoneEl.textContent.replace(/[^0-9+]/g, '') : null;

            if (title && title.length > 5 && href) {
              results.push({
                title,
                description: description || title,
                href,
                imgSrc,
                price,
                location,
                phone
              });
            }
          } catch (e) {}
        });

        return results;
      });

      console.log(`✅ Trovati ${ads.length} annunci`);

      const savedAds = [];
      for (const ad of ads.slice(0, 30)) {
        try {
          const sourceId = `annunci_${category}_${Buffer.from(ad.href).toString('base64').slice(0, 20)}`;
          
          const existing = await prisma.quickMeeting.findFirst({
            where: { sourceId }
          });

          if (!existing) {
            const saved = await prisma.quickMeeting.create({
              data: {
                title: ad.title.slice(0, 200),
                description: ad.description.slice(0, 1000),
                category: category,
                city: city.toUpperCase(),
                zone: ad.location || null,
                phone: ad.phone,
                price: ad.price,
                photos: ad.imgSrc ? [ad.imgSrc] : [],
                sourceUrl: ad.href,
                sourceId,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              }
            });
            
            savedAds.push(saved);
            console.log(`💾 Salvato: ${ad.title.slice(0, 50)}...`);
          } else {
            console.log(`⏭️ Esistente: ${ad.title.slice(0, 50)}...`);
          }
        } catch (error) {
          console.error(`❌ Errore: ${error.message}`);
        }
      }

      return savedAds;

    } catch (error) {
      console.error(`❌ Errore scraping: ${error.message}`);
      return [];
    }
  }

  async assignBumpPackages() {
    try {
      console.log('\n🎯 Assegnando pacchetti bump...');
      
      const ads = await prisma.quickMeeting.findMany({
        where: {
          bumpPackage: null,
          isActive: true
        },
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
        const randomPackage = packages[Math.floor(Math.random() * packages.length)];
        const randomTimeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
        
        let maxBumps = 0;
        let nextBumpAt = new Date();

        if (randomPackage === '1+1') maxBumps = 2;
        else if (randomPackage === '1+3') maxBumps = 4;
        else if (randomPackage === '1+7') maxBumps = 8;
        else if (randomPackage === '1x10') maxBumps = 10;
        else if (randomPackage === '1x3') maxBumps = 3;

        if (randomPackage.includes('x')) {
          nextBumpAt.setHours(0, 0, 0, 0);
        } else {
          nextBumpAt.setHours(parseInt(randomTimeSlot.split(':')[0]), 0, 0, 0);
        }

        await prisma.quickMeeting.update({
          where: { id: ad.id },
          data: {
            bumpPackage: randomPackage,
            bumpTimeSlot: randomPackage.includes('x') ? '00:00-08:00' : randomTimeSlot,
            maxBumps,
            nextBumpAt
          }
        });

        console.log(`🎯 ${ad.title.slice(0, 40)}: ${randomPackage} alle ${randomTimeSlot}`);
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
  const scraper = new ScraperCompleto();
  
  try {
    await scraper.init();
    
    // URL corretto: bakecaincontrii.com/escort/
    const baseUrl = 'https://www.bakecaincontrii.com';
    
    const categories = [
      // Proviamo diverse strutture URL possibili
      { url: `${baseUrl}/escort/`, category: 'DONNA_CERCA_UOMO', city: 'milano', filter: 'donna-cerca-uomo' },
      { url: `${baseUrl}/escort/donna-cerca-uomo/`, category: 'DONNA_CERCA_UOMO', city: 'milano' },
      { url: `${baseUrl}/escort/?category=donna-cerca-uomo`, category: 'DONNA_CERCA_UOMO', city: 'milano' },
      { url: `${baseUrl}/escort/trans/`, category: 'TRANS', city: 'milano' },
      { url: `${baseUrl}/escort/uomo-cerca-uomo/`, category: 'UOMO_CERCA_UOMO', city: 'milano' },
    ];

    // Prova prima solo /escort/ per vedere la struttura
    console.log('\n🏙️ === TEST INIZIALE: /escort/ ===');
    await scraper.scrapeAnnunci(`${baseUrl}/escort/`, 'DONNA_CERCA_UOMO', 'milano');
    
    console.log('\n⚠️ CONTROLLA LO SCREENSHOT in scripts/debug/');
    console.log('📝 Dimmi se vedi filtri per categoria o se servono URL diversi');
    
    await sleep(3000);

    // Centro Massaggi da bakeca.it (URL fisso)
    console.log(`\n🏙️ === MILANO - CENTRO_MASSAGGI ===`);
    await scraper.scrapeAnnunci(
      'https://www.bakeca.it/annunci/massaggi-benessere/milano/',
      'CENTRO_MASSAGGI',
      'milano'
    );
    
    await scraper.assignBumpPackages();
    
    console.log('\n🎉 COMPLETATO!');
    console.log('\n✅ Verifica: http://localhost:3000/incontri-veloci');
    console.log('✅ DB: npx prisma studio → QuickMeeting');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await scraper.close();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ScraperCompleto;
