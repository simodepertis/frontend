const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const prisma = new PrismaClient();

class BakecaMassaggiFix {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    console.log('🚀 Inizializzazione browser...');
    this.browser = await puppeteer.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const pages = await this.browser.pages();
    this.page = pages[0] || await this.browser.newPage();
    
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await this.page.setViewport({ width: 1920, height: 1080 });
  }

  async acceptCookies() {
    try {
      await this.page.waitForSelector('.iubenda-cs-accept-btn', { timeout: 3000 });
      await this.page.click('.iubenda-cs-accept-btn');
      console.log('✅ Cookie accettati');
      await sleep(1000);
    } catch (e) {
      console.log('ℹ️ Nessun banner cookie');
    }
  }

  async scrapeBakeca(url, category, city) {
    try {
      console.log(`\n📖 Navigando: ${url}`);
      
      await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      await sleep(3000);
      await this.acceptCookies();
      await sleep(2000);

      // Scroll
      await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await sleep(2000);

      // Screenshot
      const debugDir = path.join(__dirname, 'debug');
      if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
      await this.page.screenshot({ 
        path: path.join(debugDir, `bakeca_fixed_${Date.now()}.png`),
        fullPage: true 
      });

      // Estrai annunci con selettori CORRETTI per Bakeca.it
      const ads = await this.page.evaluate(() => {
        const results = [];
        
        // Bakeca usa questi selettori per le card annunci
        const cards = document.querySelectorAll('article.list-item, .AdElement-wrapper, .searchResultListItem');
        
        if (cards.length === 0) {
          console.log('⚠️ Nessuna card trovata, provo selettori alternativi');
          // Fallback: cerca qualsiasi elemento con link e immagine
          const allLinks = document.querySelectorAll('a[href*="/dettaglio/"]');
          
          allLinks.forEach(link => {
            const img = link.querySelector('img');
            if (!img) return;
            
            // Cerca il titolo vicino
            const titleEl = link.querySelector('h3, h2, .title, [class*="title"]') || 
                           link.closest('article, div, li')?.querySelector('h3, h2, .title');
            
            const title = titleEl ? titleEl.textContent.trim() : '';
            
            // Descrizione
            const descEl = link.querySelector('p, .description, [class*="desc"]') ||
                          link.closest('article, div, li')?.querySelector('p, .description');
            const description = descEl ? descEl.textContent.trim() : '';
            
            if (title && title.length > 5) {
              results.push({
                title: title,
                description: description || title,
                href: link.href,
                imgSrc: img.src || img.getAttribute('data-src') || '',
                source: 'fallback'
              });
            }
          });
        } else {
          // Selettori standard per le card
          cards.forEach(card => {
            try {
              // Titolo
              const titleEl = card.querySelector('h3, h2, .title, [itemprop="name"]');
              const title = titleEl ? titleEl.textContent.trim() : '';
              
              // Link
              const linkEl = card.querySelector('a[href*="/dettaglio/"]');
              const href = linkEl ? linkEl.href : '';
              
              // Immagine
              const imgEl = card.querySelector('img');
              const imgSrc = imgEl ? (imgEl.src || imgEl.getAttribute('data-src')) : '';
              
              // Descrizione
              const descEl = card.querySelector('.description, p, [itemprop="description"]');
              const description = descEl ? descEl.textContent.trim() : '';
              
              // Prezzo
              const priceEl = card.querySelector('.price, [itemprop="price"]');
              let price = null;
              if (priceEl) {
                const priceText = priceEl.textContent.replace(/[^0-9]/g, '');
                price = priceText ? parseInt(priceText) : null;
              }
              
              // Località
              const locEl = card.querySelector('.location, [itemprop="address"]');
              const location = locEl ? locEl.textContent.trim() : '';

              if (title && title.length > 5 && href) {
                results.push({
                  title,
                  description: description || title,
                  href,
                  imgSrc,
                  price,
                  location,
                  source: 'standard'
                });
              }
            } catch (e) {
              console.error('Errore parsing card:', e);
            }
          });
        }
        
        return results;
      });

      console.log(`✅ Trovati ${ads.length} annunci`);
      
      if (ads.length > 0) {
        console.log('\n📋 Primi 3:');
        ads.slice(0, 3).forEach((ad, i) => {
          console.log(`  ${i + 1}. ${ad.title.slice(0, 60)}...`);
        });
      }

      // Salva
      const saved = [];
      for (const ad of ads.slice(0, 30)) {
        try {
          const sourceId = `bakeca_fix_${Buffer.from(ad.href).toString('base64').slice(0, 20)}`;
          
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
                zone: ad.location || null,
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

      console.log('✅ Pacchetti assegnati');
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
  const scraper = new BakecaMassaggiFix();
  
  try {
    await scraper.init();
    
    // Prima PULISCO i vecchi annunci con titoli JSON
    console.log('🧹 Rimuovo annunci malformati...');
    await prisma.quickMeeting.deleteMany({
      where: {
        title: { contains: '{"@context"' }
      }
    });
    console.log('✅ Pulizia completata');
    
    // Importa Centro Massaggi con selettori corretti
    await scraper.scrapeBakeca(
      'https://www.bakeca.it/annunci/massaggi-benessere/milano/',
      'CENTRO_MASSAGGI',
      'milano'
    );
    
    await scraper.assignBumpPackages();
    
    console.log('\n🎉 COMPLETATO!');
    console.log('✅ Vai su: http://localhost:3000/incontri-veloci');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await scraper.close();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = BakecaMassaggiFix;
