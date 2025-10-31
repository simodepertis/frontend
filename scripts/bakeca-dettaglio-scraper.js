const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const prisma = new PrismaClient();

class BakecaDettaglioScraper {
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
      await this.page.waitForSelector('.iubenda-cs-accept-btn', { timeout: 2000 });
      await this.page.click('.iubenda-cs-accept-btn');
      await sleep(1000);
    } catch (e) {}
  }

  async getListingUrls(listUrl) {
    console.log(`\n📋 Raccogliendo URL da: ${listUrl}`);
    
    await this.page.goto(listUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(2000);
    await this.acceptCookies();
    await sleep(1000);
    
    // Scroll per caricare più annunci
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await sleep(2000);
    
    const urls = await this.page.evaluate(() => {
      const links = [];
      const anchors = document.querySelectorAll('a[href*="/dettaglio/"]');
      
      anchors.forEach(a => {
        const href = a.href;
        if (href && href.includes('/dettaglio/') && !links.includes(href)) {
          links.push(href);
        }
      });
      
      return links;
    });
    
    console.log(`✅ Trovati ${urls.length} annunci da scaricare`);
    return urls.slice(0, 25); // Limita a 25 per non sovraccaricare
  }

  async scrapeDetailPage(url) {
    try {
      console.log(`\n🔍 Scaricando dettaglio: ${url}`);
      
      await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      await sleep(3000);
      
      const data = await this.page.evaluate(() => {
        // Titolo
        const titleEl = document.querySelector('h1, .title, [class*="Title"]');
        const title = titleEl ? titleEl.textContent.trim() : '';
        
        // Descrizione completa
        const descEl = document.querySelector('.description, [itemprop="description"], .body, [class*="Description"]');
        const description = descEl ? descEl.textContent.trim() : '';
        
        // Tutte le foto
        const photos = [];
        document.querySelectorAll('img[src*="static.bakeca"], img[data-src*="static.bakeca"]').forEach(img => {
          const src = img.src || img.getAttribute('data-src');
          if (src && !photos.includes(src)) {
            photos.push(src);
          }
        });
        
        // Telefono
        let phone = null;
        const phoneEl = document.querySelector('[href^="tel:"], .phone, [class*="Phone"]');
        if (phoneEl) {
          phone = phoneEl.textContent.replace(/[^0-9+]/g, '') || phoneEl.href?.replace('tel:', '');
        }
        
        // WhatsApp
        let whatsapp = null;
        const waEl = document.querySelector('[href*="whatsapp"], [href*="wa.me"]');
        if (waEl) {
          const waMatch = waEl.href.match(/(\+?\d{10,15})/);
          whatsapp = waMatch ? waMatch[1] : null;
        }
        
        // Età
        let age = null;
        const ageText = document.body.innerText.match(/(\d{2})\s*anni/i);
        if (ageText) age = parseInt(ageText[1]);
        
        // Prezzo
        let price = null;
        const priceEl = document.querySelector('.price, [class*="Price"]');
        if (priceEl) {
          const priceMatch = priceEl.textContent.match(/(\d+)/);
          price = priceMatch ? parseInt(priceMatch[1]) : null;
        }
        
        // Zona/Quartiere
        let zone = null;
        const zoneEl = document.querySelector('.location, [class*="Location"], .zone');
        if (zoneEl) zone = zoneEl.textContent.trim();
        
        // Città dalla breadcrumb o URL
        let city = '';
        const breadcrumb = document.querySelector('.breadcrumb');
        if (breadcrumb) {
          const cityMatch = breadcrumb.textContent.match(/(Milano|Roma|Torino|Napoli|Firenze|Bologna)/i);
          if (cityMatch) city = cityMatch[1];
        }
        if (!city) {
          const urlMatch = window.location.href.match(/\/(milano|roma|torino|napoli|firenze|bologna)/i);
          if (urlMatch) city = urlMatch[1];
        }
        
        return {
          title,
          description,
          photos,
          phone,
          whatsapp,
          age,
          price,
          zone,
          city
        };
      });
      
      console.log(`  ✅ Titolo: ${data.title.slice(0, 60)}...`);
      console.log(`  📸 Foto: ${data.photos.length}`);
      console.log(`  📞 Tel: ${data.phone || 'N/A'}`);
      
      return data;
      
    } catch (error) {
      console.error(`  ❌ Errore: ${error.message}`);
      return null;
    }
  }

  async scrapeBakeca(listUrl, category, defaultCity) {
    try {
      // Step 1: Ottieni lista URL
      const urls = await this.getListingUrls(listUrl);
      
      // Step 2: Scrapa ogni dettaglio
      const savedAds = [];
      for (let i = 0; i < urls.length; i++) {
        console.log(`\n📊 Progresso: ${i + 1}/${urls.length}`);
        
        const data = await this.scrapeDetailPage(urls[i]);
        
        if (!data || !data.title) {
          console.log('  ⏭️ Saltato (dati incompleti)');
          continue;
        }
        
        // Step 3: Salva nel DB
        try {
          const sourceId = `bakeca_detail_${Buffer.from(urls[i]).toString('base64').slice(0, 20)}`;
          
          const existing = await prisma.quickMeeting.findFirst({
            where: { sourceId }
          });

          if (!existing) {
            const created = await prisma.quickMeeting.create({
              data: {
                title: data.title.slice(0, 200),
                description: data.description.slice(0, 2000),
                category: category,
                city: (data.city || defaultCity).toUpperCase(),
                zone: data.zone,
                phone: data.phone,
                whatsapp: data.whatsapp,
                age: data.age,
                price: data.price,
                photos: data.photos,
                sourceUrl: urls[i],
                sourceId,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              }
            });
            
            savedAds.push(created);
            console.log(`  💾 Salvato: ${data.title.slice(0, 50)}...`);
          } else {
            console.log(`  ⏭️ Già esistente`);
          }
        } catch (error) {
          console.error(`  ❌ Errore salvataggio: ${error.message}`);
        }
        
        // Pausa tra richieste
        await sleep(2000);
      }
      
      return savedAds;
      
    } catch (error) {
      console.error(`❌ Errore generale: ${error.message}`);
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
  const scraper = new BakecaDettaglioScraper();
  
  try {
    await scraper.init();
    
    // Pulisci annunci malformati
    console.log('🧹 Pulizia annunci incompleti...');
    await prisma.quickMeeting.deleteMany({
      where: {
        OR: [
          { title: { contains: '{"@context"' } },
          { description: { contains: '{"@context"' } }
        ]
      }
    });
    console.log('✅ Pulizia completata');
    
    // Scrapa Centro Massaggi con dettagli completi
    console.log('\n🏙️ === CENTRO MASSAGGI MILANO ===');
    await scraper.scrapeBakeca(
      'https://www.bakeca.it/annunci/massaggi-benessere/milano/',
      'CENTRO_MASSAGGI',
      'milano'
    );
    
    await scraper.assignBumpPackages();
    
    console.log('\n🎉 COMPLETATO!');
    console.log('✅ Vai su: http://localhost:3000/incontri-veloci');
    console.log('💡 Clicca su un annuncio per vedere il dettaglio completo');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await scraper.close();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = BakecaDettaglioScraper;
