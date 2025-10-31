const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');

// Helper sleep compatibile con nuove versioni Puppeteer
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const prisma = new PrismaClient();

// Click su banner cookie comuni
async function acceptCookies(page) {
  const selectors = [
    '#onetrust-accept-btn-handler',
    'button#onetrust-accept-btn-handler',
    'button[aria-label*="Accetta"]',
    'button:has-text("Accetta")',
    'button.cookie-accept',
    '[data-testid*="accept" i]',
  ];
  for (const sel of selectors) {
    try {
      const el = await page.$(sel);
      if (el) {
        await el.click({ delay: 50 });
        await sleep(500);
        return true;
      }
    } catch {}
  }
  return false;
}

// Scroll progressivo per caricare contenuto lazy
async function autoScroll(page, steps = 8, delay = 500) {
  for (let i = 0; i < steps; i++) {
    await page.evaluate(() => {
      window.scrollBy(0, Math.max(300, window.innerHeight * 0.8));
    });
    await sleep(delay);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
}

class BakecaScraper {
  constructor() {
    this.baseUrl = 'https://www.bakecaincontri.com';
    this.bakecaUrl = 'https://www.bakeca.it';
    this.browser = null;
    this.page = null;
  }

  async init() {
    console.log('🚀 Inizializzazione browser Bakeca...');
    this.browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await this.page.setViewport({ width: 1920, height: 1080 });
  }

  async scrapeCategory(category, city = 'milano', limit = 50) {
    try {
      const categoryUrls = {
        'DONNA_CERCA_UOMO': `${this.baseUrl}/${city}/donna-cerca-uomo/`,
        'TRANS': `${this.baseUrl}/${city}/trans/`,
        'UOMO_CERCA_UOMO': `${this.baseUrl}/${city}/uomo-cerca-uomo/`,
        'CENTRO_MASSAGGI': `${this.bakecaUrl}/annunci/massaggi-benessere/${city}/`
      };

      const url = categoryUrls[category];
      if (!url) {
        console.error(`❌ Categoria ${category} non supportata`);
        return [];
      }

      console.log(`📖 Scraping ${category} da ${url}`);
      
      await this.page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
      await sleep(1500);
      await acceptCookies(this.page);
      await autoScroll(this.page, 10, 400);

      // Debug: salva screenshot e conta selettori comuni
      try {
        const fs = require('fs');
        const path = require('path');
        const dbgDir = path.join(__dirname, 'debug');
        if (!fs.existsSync(dbgDir)) fs.mkdirSync(dbgDir, { recursive: true });
        const shotPath = path.join(dbgDir, `${city}_${category}.png`.replace(/[^a-zA-Z0-9_\.\-]/g, '_'));
        await this.page.screenshot({ path: shotPath, fullPage: true });
        const counts = await this.page.evaluate(() => {
          const q = (sel) => document.querySelectorAll(sel).length;
          return {
            '.annuncio': q('.annuncio'),
            '.ad-item': q('.ad-item'),
            '.listing-item': q('.listing-item'),
            '.card': q('.card'),
            'article': q('article'),
            '[data-testid]': q('[data-testid]'),
          };
        });
        console.log('🔎 Conteggi selettori', counts);
        console.log(`📸 Screenshot salvato: ${shotPath}`);
      } catch (e) {
        console.log('ℹ️ Debug non disponibile:', e.message);
      }

      // Estrai annunci dalla pagina
      const ads = await this.page.evaluate((category) => {
        // Prova più selettori comuni
        let adElements = document.querySelectorAll(
          '.annuncio, .ad-item, .listing-item, .card, .card-ad, .ad-card, .list-item, .search-result, [data-ad], [data-listing]'
        );
        if (!adElements || adElements.length === 0) {
          const fallback = document.querySelectorAll('article, li, .result, .result-item, .item, .tile, .grid-item');
          if (fallback && fallback.length) adElements = fallback;
        }
        const ads = [];

        adElements.forEach((element, index) => {
          try {
            // Titolo
            const titleElement = element.querySelector('h2, h3, .title, .titolo, .ad-title');
            const title = titleElement ? titleElement.textContent.trim() : `Annuncio ${index + 1}`;

            // Descrizione
            const descElement = element.querySelector('.description, .descrizione, .text, .content');
            const description = descElement ? descElement.textContent.trim() : '';

            // Prezzo
            const priceElement = element.querySelector('.price, .prezzo, .costo');
            let price = null;
            if (priceElement) {
              const priceText = priceElement.textContent.replace(/[^0-9]/g, '');
              price = priceText ? parseInt(priceText) : null;
            }

            // Età
            const ageElement = element.querySelector('.age, .eta, .anni');
            let age = null;
            if (ageElement) {
              const ageText = ageElement.textContent.replace(/[^0-9]/g, '');
              age = ageText ? parseInt(ageText) : null;
            }

            // Telefono
            const phoneElement = element.querySelector('.phone, .telefono, [href^="tel:"]');
            const phone = phoneElement ? phoneElement.textContent.replace(/[^0-9+]/g, '') : null;

            // Foto
            const imgElements = element.querySelectorAll('img, [data-src], [data-original]');
            const photos = Array.from(imgElements)
              .map(img => img.src || img.getAttribute('data-src') || img.getAttribute('data-original'))
              .filter(src => src && !src.includes('placeholder') && !src.includes('default'));

            // Link dettaglio
            const linkElement = element.querySelector('a[href*="/" i]');
            const detailUrl = linkElement ? linkElement.href : null;

            // Zone/Quartiere
            const zoneElement = element.querySelector('.zone, .zona, .quartiere, .location');
            const zone = zoneElement ? zoneElement.textContent.trim() : null;

            if (title && title.length > 5) {
              ads.push({
                title,
                description: description.slice(0, 1000), // Limita descrizione
                price,
                age,
                phone,
                photos: photos.slice(0, 5), // Max 5 foto
                zone,
                detailUrl,
                category
              });
            }
          } catch (error) {
            console.error('Errore parsing annuncio:', error);
          }
        });

        return ads;
      }, category);

      console.log(`✅ Trovati ${ads.length} annunci per ${category} in ${city}`);

      // Salva annunci nel database
      const savedAds = [];
      for (const ad of ads.slice(0, limit)) {
        try {
          const sourceId = `bakeca_${category}_${Buffer.from(ad.title + ad.phone).toString('base64').slice(0, 20)}`;
          
          // Controlla se esiste già
          const existing = await prisma.quickMeeting.findFirst({
            where: { sourceId }
          });

          if (!existing) {
            const saved = await prisma.quickMeeting.create({
              data: {
                title: ad.title,
                description: ad.description,
                category: category,
                city: city.toUpperCase(),
                zone: ad.zone,
                phone: ad.phone,
                age: ad.age,
                price: ad.price,
                photos: ad.photos,
                sourceUrl: ad.detailUrl,
                sourceId,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 giorni
              }
            });
            
            savedAds.push(saved);
            console.log(`💾 Salvato: ${ad.title}`);
          } else {
            console.log(`⏭️ Già esistente: ${ad.title}`);
          }
        } catch (error) {
          console.error(`❌ Errore salvando annuncio: ${error.message}`);
        }
      }

      return savedAds;
    } catch (error) {
      console.error(`❌ Errore scraping ${category}: ${error.message}`);
      return [];
    }
  }

  async scrapeDetailPage(url) {
    try {
      await this.page.goto(url, { waitUntil: 'networkidle2' });
      
      // Estrai dettagli aggiuntivi
      const details = await this.page.evaluate(() => {
        const whatsappElement = document.querySelector('[href*="whatsapp"], [href*="wa.me"]');
        const telegramElement = document.querySelector('[href*="telegram"], [href*="t.me"]');
        
        const allImages = Array.from(document.querySelectorAll('img'))
          .map(img => img.src)
          .filter(src => src && !src.includes('placeholder'));

        return {
          whatsapp: whatsappElement ? whatsappElement.href : null,
          telegram: telegramElement ? telegramElement.href : null,
          photos: allImages.slice(0, 10)
        };
      });

      return details;
    } catch (error) {
      console.error(`❌ Errore dettagli da ${url}: ${error.message}`);
      return null;
    }
  }

  async assignBumpPackages() {
    try {
      console.log('🎯 Assegnando pacchetti bump agli annunci...');
      
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

        if (randomPackage === '1+1') {
          maxBumps = 2; // 1 + 1 = 2 giorni
          nextBumpAt.setHours(parseInt(randomTimeSlot.split(':')[0]), 0, 0, 0);
        } else if (randomPackage === '1+3') {
          maxBumps = 4; // 1 + 3 = 4 giorni
          nextBumpAt.setHours(parseInt(randomTimeSlot.split(':')[0]), 0, 0, 0);
        } else if (randomPackage === '1+7') {
          maxBumps = 8; // 1 + 7 = 8 giorni
          nextBumpAt.setHours(parseInt(randomTimeSlot.split(':')[0]), 0, 0, 0);
        } else if (randomPackage === '1x10') {
          maxBumps = 10; // 10 volte notturno
          nextBumpAt.setHours(0, 0, 0, 0); // Mezzanotte
        } else if (randomPackage === '1x3') {
          maxBumps = 3; // 3 volte notturno
          nextBumpAt.setHours(0, 0, 0, 0); // Mezzanotte
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

        console.log(`🎯 ${ad.title}: ${randomPackage} alle ${randomTimeSlot}`);
      }

      console.log('✅ Pacchetti bump assegnati');
    } catch (error) {
      console.error(`❌ Errore assegnazione bump: ${error.message}`);
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('🔒 Browser Bakeca chiuso');
    }
    await prisma.$disconnect();
  }
}

// Funzione principale
async function main() {
  const scraper = new BakecaScraper();
  
  try {
    await scraper.init();
    
    const cities = ['milano', 'roma', 'torino', 'napoli', 'bologna'];
    const categories = ['DONNA_CERCA_UOMO', 'TRANS', 'UOMO_CERCA_UOMO', 'CENTRO_MASSAGGI'];
    
    for (const city of cities) {
      console.log(`\n🏙️ === PROCESSANDO ${city.toUpperCase()} ===`);
      
      for (const category of categories) {
        console.log(`\n📂 Categoria: ${category}`);
        await scraper.scrapeCategory(category, city, 25); // 25 annunci per categoria
        
        // Pausa tra categorie
        await sleep(5000);
      }
    }
    
    // Assegna pacchetti bump
    await scraper.assignBumpPackages();
    
    console.log('\n🎉 Scraping Bakeca completato!');
  } catch (error) {
    console.error('❌ Errore generale Bakeca:', error);
  } finally {
    await scraper.close();
  }
}

// Esegui se chiamato direttamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = BakecaScraper;
