const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧪 TEST DIRETTO UPLOAD FOTO NEL DATABASE\n');
  
  // Simula upload di 3 foto direttamente nel DB
  console.log('Creo 3 foto di test...');
  
  const foto1 = await prisma.photo.create({
    data: {
      userId: 1,
      url: 'https://placehold.co/600x800?text=Foto1',
      name: 'test-foto-1.jpg',
      size: 50000,
      status: 'DRAFT',
      isFace: false
    }
  });
  console.log(`✅ Foto 1 creata - ID ${foto1.id}`);
  
  const foto2 = await prisma.photo.create({
    data: {
      userId: 1,
      url: 'https://placehold.co/600x800?text=Foto2',
      name: 'test-foto-2.jpg',
      size: 50000,
      status: 'DRAFT',
      isFace: true // Questa ha il volto
    }
  });
  console.log(`✅ Foto 2 creata (con volto) - ID ${foto2.id}`);
  
  const foto3 = await prisma.photo.create({
    data: {
      userId: 1,
      url: 'https://placehold.co/600x800?text=Foto3',
      name: 'test-foto-3.jpg',
      size: 50000,
      status: 'DRAFT',
      isFace: false
    }
  });
  console.log(`✅ Foto 3 creata - ID ${foto3.id}`);
  
  console.log('\n✅ 3 foto DRAFT create con successo!');
  console.log('\n🎯 ORA PUOI:');
  console.log('1. Andare su /dashboard/verifica-foto');
  console.log('2. Vedere le 3 foto + quella APPROVED');
  console.log('3. Cliccare "Invia a verifica" (il bottone dovrebbe essere attivo)');
  
  await prisma.$disconnect();
}

main().catch(console.error);
