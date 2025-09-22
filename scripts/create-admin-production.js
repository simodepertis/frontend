const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminProduction() {
  try {
    console.log('👑 Creazione admin per PRODUZIONE...');
    console.log('🌐 Database URL:', process.env.DATABASE_URL ? 'Configurato' : 'NON configurato');
    
    const adminEmail = 'admin@incontriesescort.org';
    const adminPassword = 'Admin123!';
    
    // Verifica se esiste già
    const existing = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (existing) {
      console.log('✅ Admin già esistente in produzione');
      console.log('📧 Email:', existing.email);
      console.log('🔑 Ruolo:', existing.ruolo);
      return;
    }
    
    // Crea admin
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    const admin = await prisma.user.create({
      data: {
        nome: 'Amministratore',
        email: adminEmail,
        password: hashedPassword,
        ruolo: 'admin',
        slug: 'admin-system'
      }
    });
    
    console.log('🎉 Admin creato in PRODUZIONE!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('🆔 ID:', admin.id);
    
  } catch (error) {
    console.error('❌ Errore creazione admin produzione:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminProduction();
