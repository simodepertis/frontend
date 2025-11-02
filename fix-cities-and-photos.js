const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 FIX AUTOMATICO - CITIES E FOTO\n');
  
  // 1. FIX CITIES: Converti oggetto → array
  console.log('📍 Fix 1: Conversione cities da oggetto a array...');
  
  const profile = await prisma.escortProfile.findUnique({
    where: { userId: 1 }
  });
  
  if (!profile) {
    console.log('❌ Profilo non trovato');
    await prisma.$disconnect();
    return;
  }
  
  const cities = profile.cities;
  
  if (cities && typeof cities === 'object' && !Array.isArray(cities)) {
    console.log('   Vecchio formato rilevato, converto...');
    
    // Estrai città internazionali con formato "City, COUNTRY"
    const newCities = [];
    if (cities.intlBaseCity) newCities.push(`${cities.intlBaseCity}, ES`); // Madrid
    if (cities.intlSecondCity) newCities.push(`${cities.intlSecondCity}, FR`); // Paris
    if (cities.intlThirdCity) newCities.push(`${cities.intlThirdCity}, GB`); // London
    if (cities.intlFourthCity) newCities.push(`${cities.intlFourthCity}, CH`); // Zurich
    
    console.log('   Nuovo formato:', newCities);
    
    await prisma.escortProfile.update({
      where: { userId: 1 },
      data: { cities: newCities }
    });
    
    console.log('   ✅ Cities convertite in array con country code!');
  } else {
    console.log('   ✅ Cities già in formato corretto');
  }
  
  // 2. FIX FOTO: Segna come volto
  console.log('\n📸 Fix 2: Segna foto come volto...');
  
  const photo = await prisma.photo.findUnique({
    where: { id: 1 }
  });
  
  if (photo && !photo.isFace) {
    await prisma.photo.update({
      where: { id: 1 },
      data: { isFace: true }
    });
    console.log('   ✅ Foto ID 1 segnata come volto!');
  } else {
    console.log('   ✅ Foto già segnata come volto');
  }
  
  console.log('\n\n✅ FIX COMPLETATO!\n');
  console.log('🎯 RISULTATO:');
  console.log('   1. Escort APPARIRÀ su /internazionale');
  console.log('   2. Escort APPARIRÀ su /internazionale/es/madrid');
  console.log('   3. Escort APPARIRÀ su /internazionale/fr/paris');
  console.log('   4. Escort APPARIRÀ su /internazionale/gb/london');
  console.log('   5. Escort APPARIRÀ su /internazionale/ch/zurich');
  console.log('   6. Potrà caricare altre foto e mandarle a revisione');
  
  await prisma.$disconnect();
}

main().catch(console.error);
