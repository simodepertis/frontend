/**
 * Bot Debug - Vediamo cosa vede Puppeteer
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

async function debug() {
  const url = 'https://milano.bakecaincontrii.com/donna-cerca-uomo/';
  
  console.log(`🔍 Debug URL: ${url}`);
  
  const browser = await puppeteer.launch({ 
    headless: false, // Mostra il browser!
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors']
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  console.log('🌐 Caricamento pagina...');
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  
  console.log('⏳ Attendo 5 secondi...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Screenshot
  await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
  console.log('📸 Screenshot salvato: debug-screenshot.png');
  
  // HTML
  const html = await page.content();
  fs.writeFileSync('debug-page.html', html);
  console.log('📄 HTML salvato: debug-page.html');
  
  // Conta link
  const links = await page.evaluate(() => {
    const all = document.querySelectorAll('a[href]');
    return {
      total: all.length,
      links: Array.from(all).slice(0, 20).map(a => ({
        href: a.getAttribute('href'),
        text: a.textContent.trim().substring(0, 50)
      }))
    };
  });
  
  console.log(`🔗 Link totali trovati: ${links.total}`);
  console.log('🔗 Primi 20 link:');
  links.links.forEach((l, i) => {
    console.log(`   ${i+1}. ${l.href} - "${l.text}"`);
  });
  
  console.log('\n⏸️ Browser rimane aperto per 30 secondi, controlla manualmente...');
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  await browser.close();
  console.log('✅ Debug completato!');
}

debug().catch(err => {
  console.error('❌ Errore:', err);
  process.exit(1);
});
