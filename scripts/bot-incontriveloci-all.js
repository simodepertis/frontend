// Super bot IncontriVeloci: lancia in sequenza tutti i bot esistenti
// - bot-bakecaincontri.js per tutte le categorie (DONNA, TRANS, UOMO)
// - bot-bakeca-massaggi.js per i massaggi da bakeca.it
// - (facoltativo) bot-escort-advisor.js per le recensioni
// Usa i bot esistenti senza modificarli, così non rischiamo di rompere la logica.

const { spawn } = require('child_process');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// CITIES può essere:
// - una lista di città separate da virgola, es: "Milano,Roma,Napoli"
// - la stringa speciale "ALL" per usare una lista interna di città principali
const ALL_CITIES = [
  'Milano', 'Roma', 'Napoli', 'Torino', 'Bologna', 'Firenze', 'Genova', 'Palermo', 'Catania',
  'Bari', 'Verona', 'Padova', 'Brescia', 'Trieste', 'Prato', 'Parma', 'Modena', 'Reggio Emilia',
  'Perugia', 'Ravenna', 'Livorno', 'Cagliari', 'Foggia', 'Rimini', 'Salerno', 'Ferrara',
  'Sassari', 'Latina', 'Monza', 'Pescara', 'Bergamo', 'Forlì', 'Vicenza', 'Terni', 'Bolzano',
  'Novara', 'Piacenza', 'Ancona', 'Taranto'
];

const RAW_CITIES = (() => {
  const raw = process.env.CITIES || 'Milano';
  if (raw.toUpperCase() === 'ALL') {
    return ALL_CITIES;
  }
  return raw
    .split(',')
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
})();

function buildRuns() {
  const runs = [];

  for (const city of RAW_CITIES) {
    const CITY_UPPER = city;

    // Bakecaincontrii - Donna cerca uomo / Trans / Uomo cerca uomo
    runs.push({
      name: `bakecaincontrii_donna_${CITY_UPPER.toLowerCase()}`,
      script: 'scripts/bot-bakecaincontri.js',
      env: {
        USER_ID: process.env.USER_ID || '1',
        CATEGORY: 'DONNA_CERCA_UOMO',
        CITY: CITY_UPPER,
        LIMIT: process.env.LIMIT_BAKECAINCONTRII || '50',
        LOOP: '0',
      },
    });

    runs.push({
      name: `bakecaincontrii_trans_${CITY_UPPER.toLowerCase()}`,
      script: 'scripts/bot-bakecaincontri.js',
      env: {
        USER_ID: process.env.USER_ID || '1',
        CATEGORY: 'TRANS',
        CITY: CITY_UPPER,
        LIMIT: process.env.LIMIT_BAKECAINCONTRII || '50',
        LOOP: '0',
      },
    });

    runs.push({
      name: `bakecaincontrii_uomo_${CITY_UPPER.toLowerCase()}`,
      script: 'scripts/bot-bakecaincontri.js',
      env: {
        USER_ID: process.env.USER_ID || '1',
        CATEGORY: 'UOMO_CERCA_UOMO',
        CITY: CITY_UPPER,
        LIMIT: process.env.LIMIT_BAKECAINCONTRII || '50',
        LOOP: '0',
      },
    });

    // Bakeca massaggi - centri massaggi
    runs.push({
      name: `bakeca_massaggi_${CITY_UPPER.toLowerCase()}`,
      script: 'scripts/bot-bakeca-massaggi.js',
      env: {
        USER_ID: process.env.USER_ID || '1',
        CITY: CITY_UPPER,
        LIMIT: process.env.LIMIT_BAKECA_MASSAGGI || '50',
        LOOP: '0',
      },
    });
  }

  // Escort Advisor recensioni (una sola volta, non dipende dalla città)
  runs.push({
    name: 'escort_advisor_reviews',
    script: 'scripts/bot-escort-advisor.js',
    env: {
      LIMIT: process.env.LIMIT_ESCORT_ADVISOR || '50',
      LOOP: '0',
    },
  });

  return runs;
}

async function runChild(name, script, extraEnv) {
  return new Promise((resolve) => {
    console.log(`\n==============================`);
    console.log(`▶️  Start run: ${name} (${script})`);
    console.log(`==============================`);

    const child = spawn('node', [script], {
      env: {
        ...process.env,
        ...extraEnv,
      },
      stdio: 'inherit',
    });

    child.on('close', (code) => {
      console.log(`\n⏹  Run '${name}' terminata con codice ${code}`);
      resolve();
    });

    child.on('error', (err) => {
      console.error(`❌ Errore nel run '${name}':`, err.message);
      resolve();
    });
  });
}

async function main() {
  const INTERVAL_MINUTES = parseInt(process.env.INTERVAL_MINUTES || '10', 10);

  console.log('🤖 Super Bot IncontriVeloci ALL - START');
  console.log(`📊 USER_ID=${process.env.USER_ID || '1'}, INTERVAL_MINUTES=${INTERVAL_MINUTES}`);

  while (true) {
    const RUNS = buildRuns();

    for (const run of RUNS) {
      try {
        await runChild(run.name, run.script, run.env);
      } catch (err) {
        console.error(`❌ Errore in run '${run.name}':`, err.message);
      }
    }

    console.log(`\n♻️  Ciclo completo terminato. Attendo ${INTERVAL_MINUTES} minuti prima del prossimo giro...`);
    await sleep(INTERVAL_MINUTES * 60 * 1000);
  }
}

main().catch((err) => {
  console.error('❌ Errore fatale nel super bot:', err);
  process.exit(1);
});
