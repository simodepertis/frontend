const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const prisma = new PrismaClient();

class BakecaScraperV2 {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    console.log('🚀 Inizializzazione browser (modalità visibile per debug)...');
    this.browser = await puppeteer.launch({ 
      headless: false,  // Browser visibile per vedere cosa succede
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage'
      ]
    });
    this.page = await this.browser.newPage();
    
    // Simula browser reale
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Rimuovi webdriver
    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });
  }

  async acceptCookies() {
    const cookieSelectors = [
      'button:has-text("Accetta")',
      'button:has-text("Accept")',
      'button[id*="accept"]',
      'button[class*="accept"]',
      '.cookie-accept',
      '#onetrust-accept-btn-handler',
      '[data-testid*="accept"]'
    ];

    for (const selector of cookieSelectors) {
      try {
        await this.page.waitForSelector(selector, { timeout: 2000 });
        await this.page.click(selector);
        console.log('✅ Cookie banner accettato');
        await sleep(1000);
        return true;
      } catch (e) {
        // Selector non trovato, prova il prossimo
      }
    }
    return false;
  }

  async autoScroll() {
    await this.page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 300;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if(totalHeight >= scrollHeight - window.innerHeight){
            clearInterval(timer);
            resolve();
          }
        }, 200);
      });
    });
    
    // Torna su
    await this.page.evaluate(() => window.scrollTo(0, 0));
    await sleep(1000);
  }

  async scrapeGenericListing(url, category, city) {
    try {
      console.log(`\n📖 Navigando verso: ${url}`);
      
      await this.page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 60000 
      });
      
      await sleep(3000);
      await this.acceptCookies();
      await sleep(2000);
      await this.autoScroll();
      await sleep(2000);

      // Screenshot per debug
      const debugDir = path.join(__dirname, 'debug');
      if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
      const screenshotPath = path.join(debugDir, `${city}_${category}_${Date.now()}.png`);
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`📸 Screenshot salvato: ${screenshotPath}`);

      // Estrai TUTTO il testo visibile e la struttura
      const pageInfo = await this.page.evaluate(() => {
        // Conta tutti i possibili contenitori
        const allDivs = document.querySelectorAll('div');
        const allArticles = document.querySelectorAll('article');
        const allLis = document.querySelectorAll('li');
        const allAs = document.querySelectorAll('a[href]');
        
        // Cerca pattern comuni per annunci
        const possibleAds = [];
        
        // Strategia 1: cerca link con immagini
        document.querySelectorAll('a[href]').forEach((link, idx) => {
          const img = link.querySelector('img');
          const hasText = link.textContent.trim().length > 10;
          
          if (img && hasText) {
            const title = link.textContent.trim().slice(0, 100);
            const href = link.href;
            const imgSrc = img.src || img.getAttribute('data-src') || '';
            
            possibleAds.push({
              method: 'link-with-image',
              index: idx,
              title,
              href,
              imgSrc
            });
          }
        });

        return {
          counts: {
            divs: allDivs.length,
            articles: allArticles.length,
            lis: allLis.length,
            links: allAs.length
          },
          possibleAds: possibleAds.slice(0, 50),
          bodyText: document.body.innerText.slice(0, 500)
        };
      });

      console.log('🔍 Analisi pagina:', JSON.stringify(pageInfo.counts, null, 2));
      console.log(`📊 Potenziali annunci trovati: ${pageInfo.possibleAds.length}`);
      
      if (pageInfo.possibleAds.length > 0) {
        console.log('📋 Primi 3 annunci trovati:');
        pageInfo.possibleAds.slice(0, 3).forEach((ad, i) => {
          console.log(`  ${i+1}. ${ad.title}`);
          console.log(`     Link: ${ad.href}`);
        });
      } else {
        console.log('⚠️ NESSUN ANNUNCIO TROVATO con i pattern standard');
        console.log('📄 Primi 500 caratteri del body:', pageInfo.bodyText);
      }

      // Salva gli annunci trovati
      const savedAds = [];
      for (const ad of pageInfo.possibleAds.slice(0, 25)) {
        try {
          const sourceId = `bakeca_v2_${Buffer.from(ad.href).toString('base64').slice(0, 20)}`;
          
          const existing = await prisma.quickMeeting.findFirst({
            where: { sourceId }
          });

          if (!existing) {
            const saved = await prisma.quickMeeting.create({
              data: {
                title: ad.title || 'Annuncio senza titolo',
                description: ad.title,
                category: category,
                city: city.toUpperCase(),
                photos: ad.imgSrc ? [ad.imgSrc] : [],
                sourceUrl: ad.href,
                sourceId,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              }
            });
            
            savedAds.push(saved);
            console.log(`💾 Salvato: ${ad.title.slice(0, 50)}...`);
          } else {
            console.log(`⏭️ Già esistente: ${ad.title.slice(0, 50)}...`);
          }
        } catch (error) {
          console.error(`❌ Errore salvando: ${error.message}`);
        }
      }

      return savedAds;

    } catch (error) {
      console.error(`❌ Errore scraping ${url}: ${error.message}`);
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

      console.log('✅ Pacchetti bump assegnati');
    } catch (error) {
      console.error(`❌ Errore bump: ${error.message}`);
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('🔒 Browser chiuso');
    }
    await prisma.$disconnect();
  }
}

async function main() {
  const scraper = new BakecaScraperV2();
  
  try {
    await scraper.init();
    
    const targets = [
      { url: 'https://www.bakecaincontri.com/milano/donna-cerca-uomo/', category: 'DONNA_CERCA_UOMO', city: 'milano' },
      { url: 'https://www.bakecaincontri.com/milano/trans/', category: 'TRANS', city: 'milano' },
      { url: 'https://www.bakecaincontri.com/milano/uomo-cerca-uomo/', category: 'UOMO_CERCA_UOMO', city: 'milano' },
      { url: 'https://www.bakeca.it/annunci/massaggi-benessere/milano/', category: 'CENTRO_MASSAGGI', city: 'milano' },
    ];

    for (const target of targets) {
      console.log(`\n🏙️ === ${target.city.toUpperCase()} - ${target.category} ===`);
      await scraper.scrapeGenericListing(target.url, target.category, target.city);
      await sleep(5000);
    }
    
    await scraper.assignBumpPackages();
    
    console.log('\n🎉 Scraping completato!');
    console.log('\n📊 Verifica risultati:');
    console.log('- Vai su: http://localhost:3000/incontri-veloci');
    console.log('- Oppure: npx prisma studio → tabella QuickMeeting');
    
  } catch (error) {
    console.error('❌ Errore generale:', error);
  } finally {
    await scraper.close();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = BakecaScraperV2;
