const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 FIX COMPLETO FOTO\n');
  
  // 1. Verifica foto esistenti
  const existing = await prisma.photo.findMany({
    where: { userId: 1 }
  });
  
  console.log(`📸 Foto esistenti: ${existing.length}`);
  existing.forEach(p => {
    console.log(`   ID ${p.id}: ${p.status}, isFace=${p.isFace}, name="${p.name}"`);
  });
  
  // 2. Aggiorna le foto DRAFT con nomi corretti
  const drafts = existing.filter(p => p.status === 'DRAFT');
  console.log(`\n🔧 Aggiorno ${drafts.length} foto DRAFT con nomi corretti...`);
  
  for (let i = 0; i < drafts.length; i++) {
    const photo = drafts[i];
    const newName = `foto-${i+1}.jpg`;
    await prisma.photo.update({
      where: { id: photo.id },
      data: { name: newName }
    });
    console.log(`   ✅ Foto ID ${photo.id}: name aggiornato a "${newName}"`);
  }
  
  // 3. Verifica finale
  const final = await prisma.photo.findMany({
    where: { userId: 1 }
  });
  
  const finalDrafts = final.filter(p => p.status === 'DRAFT');
  const finalWithFace = finalDrafts.filter(p => p.isFace);
  
  console.log('\n✅ STATO FINALE:');
  console.log(`   Foto DRAFT: ${finalDrafts.length}`);
  console.log(`   Con volto: ${finalWithFace.length}`);
  
  if (finalDrafts.length >= 3 && finalWithFace.length >= 1) {
    console.log('\n🎉 TUTTO OK! Ora:');
    console.log('   1. Vai su /dashboard/verifica-foto');
    console.log('   2. Premi F5 per ricaricare la pagina');
    console.log('   3. Pulisci la cache (Ctrl+Shift+Delete)');
    console.log('   4. Il bottone "Invia a verifica" sarà ATTIVO');
  } else {
    console.log('\n⚠️ Mancano ancora foto o volto');
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
