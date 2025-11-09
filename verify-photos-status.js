const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 VERIFICA STATO FOTO NEL DATABASE\n');
  
  const photos = await prisma.photo.findMany({
    where: { userId: 1 },
    orderBy: { id: 'desc' }
  });
  
  console.log(`📸 Totale foto: ${photos.length}\n`);
  
  photos.forEach((p, i) => {
    console.log(`${i+1}. ID ${p.id}:`);
    console.log(`   Nome: ${p.name}`);
    console.log(`   Status: ${p.status}`);
    console.log(`   IsFace: ${p.isFace}`);
    console.log(`   CreatedAt: ${p.createdAt}`);
    console.log('');
  });
  
  const draft = photos.filter(p => p.status === 'DRAFT');
  const approved = photos.filter(p => p.status === 'APPROVED');
  const withFace = draft.filter(p => p.isFace);
  
  console.log('📊 RIEPILOGO:');
  console.log(`   DRAFT (da inviare a verifica): ${draft.length}`);
  console.log(`   APPROVED (già pubblicate): ${approved.length}`);
  console.log(`   DRAFT con volto: ${withFace.length}`);
  console.log('');
  
  if (draft.length >= 3 && withFace.length >= 1) {
    console.log('✅ REQUISITI OK: puoi inviare a verifica!');
  } else {
    console.log('❌ REQUISITI NON SODDISFATTI:');
    if (draft.length < 3) console.log(`   - Mancano ${3 - draft.length} foto DRAFT`);
    if (withFace.length < 1) console.log('   - Manca almeno 1 foto con volto');
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
