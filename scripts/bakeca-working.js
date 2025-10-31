const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const prisma = new PrismaClient();

class BakecaWorking {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    console.log('🚀 Inizializzazione browser...');
    this.browser = await puppeteer.launch({ 
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ]
    });
    
    const pages = await this.browser.pages();
    this.page = pages[0] || await this.browser.newPage();
    
    await this.page.setViewport({ width: 1366, height: 768 });
    
    // Anti-detection
    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      window.chrome = { runtime: {} };
    });
  }

  async acceptCookies() {
    try {
      await this.page.waitForSelector('.iubenda-cs-accept-btn', { timeout: 3000 });
      await this.page.click('.iubenda-cs-accept-btn');
      await sleep(1000);
      console.log('✅ Cookie accettati');
    } catch (e) {}
  }

  async scrapeBakeca(url, category, city) {
    try {
      console.log(`\n📖 Navigando: ${url}`);
      
      await this.page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 60000 
      });
      
      await sleep(4000);
      await this.acceptCookies();
      await sleep(2000);

      // Scroll delicato
      await this.page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 3);
      });
      await sleep(2000);

      // Screenshot
      const debugDir = path.join(__dirname, 'debug');
      if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
      await this.page.screenshot({ 
        path: path.join(debugDir, `working_${city}_${category}_${Date.now()}.png`),
        fullPage: false 
      });

      // Estrai DALLA LISTA (non entrare nei dettagli)
      const ads = await this.page.evaluate(() => {
        const results = [];
        
        // Cerca tutti i link agli annunci
        const links = document.querySelectorAll('a[href*="/dettaglio/"]');
        
        links.forEach((link) => {
          try {
            // Trova il container dell'annuncio (parent più vicino)
            let container = link.closest('li, article, .item, .card, [class*="result"]') || link;
            
            // Titolo
            let title = '';
            const titleEl = container.querySelector('h2, h3, h4, .title, [class*="title"]');
            if (titleEl) {
              title = titleEl.textContent.trim();
            } else {
              // Fallback: prendi testo dal link
              title = link.textContent.trim().split('\n')[0].trim();
            }
            
            // Link
            const href = link.href;
            
            // Immagine
            let imgSrc = '';
            const img = container.querySelector('img');
            if (img) {
              imgSrc = img.src || img.getAttribute('data-src') || img.getAttribute('data-original') || '';
            }
            
            // Descrizione (se visibile nella lista)
            let description = '';
            const descEl = container.querySelector('p, .description, [class*="desc"]');
            if (descEl) {
              description = descEl.textContent.trim();
            }
            
            // Prezzo (se visibile nella lista)
            let price = null;
            const priceEl = container.querySelector('.price, .prezzo, [class*="price"]');
            if (priceEl) {
              const priceMatch = priceEl.textContent.match(/(\d+)/);
              if (priceMatch) price = parseInt(priceMatch[1]);
            }
            
            // Zona (se visibile nella lista)
            let zone = '';
            const zoneEl = container.querySelector('.location, .zona, [class*="location"]');
            if (zoneEl) {
              zone = zoneEl.textContent.trim();
            }

            if (title && title.length > 5 && href && !href.includes('javascript:')) {
              results.push({
                title,
                description: description || title,
                href,
                imgSrc,
                price,
                zone
              });
            }
          } catch (e) {
            console.error('Errore parsing:', e);
          }
        });
        
        return results;
      });

      console.log(`✅ Trovati ${ads.length} annunci dalla lista`);
      
      if (ads.length > 0) {
        console.log('\n📋 Primi 3:');
        ads.slice(0, 3).forEach((ad, i) => {
          console.log(`  ${i + 1}. ${ad.title.slice(0, 60)}...`);
        });
      }

      // Salva nel DB
      const saved = [];
      for (const ad of ads.slice(0, 30)) {
        try {
          const sourceId = `bakeca_${category}_${Buffer.from(ad.href).toString('base64').slice(0, 20)}`;
          
          const existing = await prisma.quickMeeting.findFirst({
            where: { sourceId }
          });

          if (!existing) {
            const created = await prisma.quickMeeting.create({
              data: {
                title: ad.title.slice(0, 200),
                description: ad.description.slice(0, 1000),
                category: category,
                city: city.toUpperCase(),
                zone: ad.zone || null,
                price: ad.price,
                photos: ad.imgSrc ? [ad.imgSrc] : [],
                sourceUrl: ad.href,
                sourceId,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              }
            });
            
            saved.push(created);
            console.log(`💾 Salvato: ${ad.title.slice(0, 50)}...`);
          } else {
            console.log(`⏭️ Esistente: ${ad.title.slice(0, 50)}...`);
          }
        } catch (error) {
          console.error(`❌ Errore: ${error.message}`);
        }
      }

      return saved;

    } catch (error) {
      console.error(`❌ Errore: ${error.message}`);
      return [];
    }
  }

  async assignBumpPackages() {
    try {
      console.log('\n🎯 Assegnando pacchetti bump...');
      
      const ads = await prisma.quickMeeting.findMany({
        where: { bumpPackage: null, isActive: true },
        take: 100
      });

      const packages = ['1+1', '1+3', '1+7', '1x10', '1x3'];
      const slots = [
        '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
        '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00',
        '16:00-17:00', '17:00-18:00', '18:00-19:00', '19:00-20:00',
        '20:00-21:00', '21:00-22:00', '22:00-23:00', '23:00-00:00'
      ];

      for (const ad of ads) {
        const pkg = packages[Math.floor(Math.random() * packages.length)];
        const slot = slots[Math.floor(Math.random() * slots.length)];
        
        let maxBumps = pkg === '1+1' ? 2 : pkg === '1+3' ? 4 : pkg === '1+7' ? 8 : pkg === '1x10' ? 10 : 3;
        let nextBumpAt = new Date();
        nextBumpAt.setHours(pkg.includes('x') ? 0 : parseInt(slot.split(':')[0]), 0, 0, 0);

        await prisma.quickMeeting.update({
          where: { id: ad.id },
          data: {
            bumpPackage: pkg,
            bumpTimeSlot: pkg.includes('x') ? '00:00-08:00' : slot,
            maxBumps,
            nextBumpAt
          }
        });
      }

      console.log(`✅ Pacchetti assegnati a ${ads.length} annunci`);
    } catch (error) {
      console.error(`❌ Errore: ${error.message}`);
    }
  }

  async close() {
    if (this.browser) await this.browser.close();
    await prisma.$disconnect();
  }
}

async function main() {
  const scraper = new BakecaWorking();
  
  try {
    await scraper.init();
    
    // Pulisci vecchi annunci malformati
    console.log('🧹 Pulizia...');
    await prisma.quickMeeting.deleteMany({
      where: {
        OR: [
          { title: { contains: '{"@context"' } },
          { title: { contains: 'schema.org' } }
        ]
      }
    });
    
    // SOLO Centro Massaggi per ora (funziona)
    console.log('\n🏙️ === CENTRO MASSAGGI MILANO ===');
    await scraper.scrapeBakeca(
      'https://www.bakeca.it/annunci/massaggi-benessere/milano/',
      'CENTRO_MASSAGGI',
      'milano'
    );
    
    // Pausa tra categorie
    await sleep(5000);
    
    await scraper.assignBumpPackages();
    
    console.log('\n🎉 COMPLETATO!');
    console.log('✅ Vai su: http://localhost:3000/incontri-veloci');
    console.log('\n💡 Per le altre categorie serve trovare gli URL giusti di bakecaincontrii.com');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await scraper.close();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = BakecaWorking;
