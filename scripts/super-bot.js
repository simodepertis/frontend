// Super Bot: esegue in sequenza tutti i bot senza modificare la loro logica interna
// - Bot annunci Bakecaincontrii (tutte le città/categorie)
// - Bot massaggi Bakeca
// - Bot recensioni Escort Advisor

const { spawn } = require('child_process');
const path = require('path');

function runStep(name, scriptPath, envOverrides = {}) {
  return new Promise((resolve) => {
    console.log(`\n========================`);
    console.log(`🚀 STEP: ${name}`);
    console.log(`========================`);

    const cwd = path.join(__dirname, '..');
    const env = { ...process.env, ...envOverrides };

    const child = spawn('node', [scriptPath], {
      cwd,
      env,
      stdio: 'inherit',
    });

    child.on('exit', (code) => {
      if (code === 0) {
        console.log(`✅ STEP completato: ${name}`);
      } else {
        console.log(`⚠️ STEP terminato con codice ${code}: ${name}`);
      }
      resolve();
    });
  });
}

async function main() {
  // STEP 1: Annunci Bakecaincontrii (multi-city / multi-category)
  // Usa le variabili già impostate nell'ambiente, con questi default di sicurezza
  const bakeEnv = {
    USER_ID: process.env.USER_ID || '4',
    CATEGORY: process.env.CATEGORY || 'ALL',
    CITY: process.env.CITY || 'ALL',
    LIMIT: process.env.LIMIT || '20',
    API_BASE: process.env.API_BASE || 'https://incontriescort.org',
    LOOP: process.env.LOOP || '0', // nel super-bot giriamo una volta sola
    INTERVAL_MINUTES: process.env.INTERVAL_MINUTES || '20',
  };

  await runStep(
    'Annunci Bakecaincontrii (tutte le città / categorie)',
    'scripts/bot-bakecaincontri.js',
    bakeEnv,
  );

  // STEP 2: Centri Massaggi da Bakeca.it
  const massaggiEnv = {
    USER_ID: process.env.USER_ID || '4',
    CITY: process.env.MASSAGGI_CITY || process.env.CITY || 'Milano',
    LIMIT: process.env.MASSAGGI_LIMIT || '20',
    LOOP: '0',
  };

  await runStep(
    'Centri Massaggi da Bakeca.it',
    'scripts/bot-bakeca-massaggi.js',
    massaggiEnv,
  );

  // STEP 3: Recensioni Escort Advisor
  const reviewsEnv = {
    LIMIT: process.env.REVIEWS_LIMIT || '50',
    LOOP: '0',
  };

  await runStep(
    'Recensioni da Escort Advisor',
    'scripts/bot-escort-advisor.js',
    reviewsEnv,
  );

  console.log('\n🎉 SUPER-BOT COMPLETATO (annunci + massaggi + recensioni)');
}

main().catch((err) => {
  console.error('❌ Errore nel super-bot:', err);
  process.exit(1);
});
