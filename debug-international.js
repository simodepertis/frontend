// Script debug per controllare città internazionali nel database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 DEBUG CITTÀ INTERNAZIONALI\n');
  
  // Trova tutti gli escort con città
  const profiles = await prisma.escortProfile.findMany({
    where: {
      cities: { not: null }
    },
    include: {
      user: {
        select: { id: true, nome: true, email: true }
      }
    }
  });

  console.log(`📊 Trovati ${profiles.length} profili con città\n`);

  profiles.forEach((profile) => {
    const cities = profile.cities;
    console.log(`\n👤 ${profile.user.nome} (ID: ${profile.user.id})`);
    console.log(`   Email: ${profile.user.email}`);
    console.log(`   Città nel DB:`);
    
    if (Array.isArray(cities)) {
      cities.forEach((city, i) => {
        console.log(`   ${i + 1}. "${city}"`);
        
        // Analizza formato
        if (typeof city === 'string') {
          if (city.includes(', ')) {
            const parts = city.split(', ');
            console.log(`      ✅ Formato corretto: Città="${parts[0]}" Paese="${parts[1]}"`);
          } else {
            console.log(`      ⚠️  Formato vecchio: solo città, manca paese`);
          }
        }
      });
    } else {
      console.log(`   ❌ cities non è un array:`, cities);
    }
  });

  console.log('\n\n💡 SOLUZIONE:');
  console.log('Se vedi "Formato vecchio", l\'escort deve:');
  console.log('1. Andare su /dashboard/mio-profilo/citta-di-lavoro');
  console.log('2. Rimuovere le città internazionali');
  console.log('3. Re-aggiungerle selezionando Nazione → Città');
  console.log('4. Salvare');
  
  await prisma.$disconnect();
}

main().catch(console.error);
