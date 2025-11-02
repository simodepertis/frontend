// Test diretto API /api/public/annunci
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const INTERNATIONAL_CITIES = {
  'Paris': 'FR', 'Marseille': 'FR', 'Lyon': 'FR', 'Nice': 'FR', 'Toulouse': 'FR',
  'Berlin': 'DE', 'Munich': 'DE', 'Frankfurt': 'DE', 'Hamburg': 'DE', 'Cologne': 'DE',
  'Madrid': 'ES', 'Barcelona': 'ES', 'Valencia': 'ES', 'Seville': 'ES', 'Bilbao': 'ES',
  'London': 'GB', 'Manchester': 'GB', 'Birmingham': 'GB', 'Edinburgh': 'GB', 'Liverpool': 'GB',
  'Zurich': 'CH', 'Geneva': 'CH', 'Basel': 'CH', 'Bern': 'CH', 'Lausanne': 'CH',
  'Amsterdam': 'NL', 'Rotterdam': 'NL', 'The Hague': 'NL', 'Utrecht': 'NL',
  'Brussels': 'BE', 'Antwerp': 'BE', 'Ghent': 'BE', 'Bruges': 'BE',
  'Vienna': 'AT', 'Salzburg': 'AT', 'Innsbruck': 'AT', 'Graz': 'AT',
  'Prague': 'CZ', 'Brno': 'CZ', 'Ostrava': 'CZ',
  'Warsaw': 'PL', 'Krakow': 'PL', 'Gdansk': 'PL', 'Wroclaw': 'PL',
  'Lisbon': 'PT', 'Porto': 'PT', 'Faro': 'PT', 'Coimbra': 'PT',
  'Athens': 'GR', 'Thessaloniki': 'GR', 'Mykonos': 'GR', 'Santorini': 'GR',
  'Stockholm': 'SE', 'Gothenburg': 'SE', 'Malmö': 'SE',
  'Copenhagen': 'DK', 'Aarhus': 'DK', 'Odense': 'DK',
  'Oslo': 'NO', 'Bergen': 'NO', 'Trondheim': 'NO',
  'Helsinki': 'FI', 'Espoo': 'FI', 'Tampere': 'FI',
  'Dublin': 'IE', 'Cork': 'IE', 'Galway': 'IE',
  'Budapest': 'HU', 'Debrecen': 'HU', 'Szeged': 'HU',
  'Istanbul': 'TR', 'Ankara': 'TR', 'Izmir': 'TR', 'Antalya': 'TR',
  'Dubai': 'AE', 'Abu Dhabi': 'AE', 'Doha': 'QA', 'Hong Kong': 'HK',
  'New York': 'US', 'Los Angeles': 'US', 'Miami': 'US', 'Las Vegas': 'US',
  'Toronto': 'CA', 'Montreal': 'CA', 'Vancouver': 'CA',
  'Moscow': 'RU', 'Mosca': 'RU', 'St Petersburg': 'RU', 'San Pietroburgo': 'RU'
};

async function main() {
  console.log('🧪 TEST API /api/public/annunci\n');

  const users = await prisma.user.findMany({
    where: { 
      ruolo: { in: ['escort', 'agency'] },
      suspended: false
    },
    include: {
      escortProfile: true,
      photos: {
        where: { status: 'APPROVED' },
        take: 1,
        orderBy: { createdAt: 'desc' }
      }
    },
    take: 100
  });

  console.log(`📊 Trovati ${users.length} utenti escort/agency\n`);

  const items = users
    .filter(u => u.escortProfile)
    .map(u => {
      const profile = u.escortProfile;
      let cities = profile.cities || [];
      
      console.log(`\n👤 ${u.nome} (ID: ${u.id})`);
      console.log(`   cities raw:`, JSON.stringify(cities, null, 2));
      
      // COMPATIBILITÀ: Se cities è un oggetto (vecchio formato), estrai le città
      if (cities && typeof cities === 'object' && !Array.isArray(cities)) {
        console.log('   ⚠️  Rilevato VECCHIO formato (oggetto)');
        const oldCities = [];
        if (cities.intlBaseCity) oldCities.push(cities.intlBaseCity);
        if (cities.intlSecondCity) oldCities.push(cities.intlSecondCity);
        if (cities.intlThirdCity) oldCities.push(cities.intlThirdCity);
        if (cities.intlFourthCity) oldCities.push(cities.intlFourthCity);
        if (Array.isArray(cities.internationalCities)) {
          oldCities.push(...cities.internationalCities);
        }
        cities = oldCities.filter(Boolean);
        console.log('   ✅ Convertito in array:', cities);
      }
      
      // Estrai countries dalle città internazionali
      const countries = [];
      const intlCities = [];
      
      if (Array.isArray(cities)) {
        cities.forEach((c) => {
          const city = String(c).trim();
          console.log(`   🔍 Processando città: "${city}"`);
          
          // Se contiene virgola, è formato "Città, Paese"
          if (city.includes(',')) {
            const parts = city.split(',').map(p => p.trim());
            if (parts.length >= 2) {
              intlCities.push(parts[0]);
              const country = parts[parts.length - 1].toUpperCase();
              if (!countries.includes(country)) {
                countries.push(country);
              }
              console.log(`      ✅ Formato nuovo: città="${parts[0]}" paese="${country}"`);
            }
          } else {
            // Controlla se è una città internazionale nota (case-insensitive)
            let countryCode = INTERNATIONAL_CITIES[city];
            if (!countryCode) {
              const cityKey = Object.keys(INTERNATIONAL_CITIES).find(k => k.toLowerCase() === city.toLowerCase());
              if (cityKey) countryCode = INTERNATIONAL_CITIES[cityKey];
            }
            
            if (countryCode) {
              intlCities.push(city);
              if (!countries.includes(countryCode)) {
                countries.push(countryCode);
              }
              console.log(`      ✅ Trovato paese: città="${city}" paese="${countryCode}"`);
            } else {
              intlCities.push(city);
              console.log(`      ⚠️  Città non riconosciuta: "${city}" (considerata italiana)`);
            }
          }
        });
      }

      console.log(`   📍 Risultato finale:`);
      console.log(`      Cities: ${intlCities.join(', ')}`);
      console.log(`      Countries: ${countries.join(', ')}`);

      return {
        id: u.id,
        slug: u.slug || `escort-${u.id}`,
        name: u.nome,
        cities: intlCities,
        countries: countries.length > 0 ? countries : [],
        tier: profile.tier || 'STANDARD',
        isVerified: profile.consentAcceptedAt ? true : false,
        coverUrl: u.photos[0]?.url || null
      };
    });

  console.log('\n\n📋 RISULTATO FINALE API:');
  console.log(JSON.stringify(items, null, 2));

  console.log('\n\n💡 ANALISI:');
  const withCountries = items.filter(i => i.countries.length > 0);
  console.log(`✅ Escort con paesi internazionali: ${withCountries.length}`);
  console.log(`❌ Escort senza paesi: ${items.length - withCountries.length}`);

  await prisma.$disconnect();
}

main().catch(console.error);
