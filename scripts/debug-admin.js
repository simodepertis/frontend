const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugAdmin() {
  try {
    console.log('🔍 Debug utente admin...');
    
    // Cerca utente admin
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@incontriesescort.org' }
    });
    
    if (admin) {
      console.log('✅ Utente admin trovato:');
      console.log('📧 Email:', admin.email);
      console.log('👤 Nome:', admin.nome);
      console.log('🔑 Ruolo:', admin.ruolo);
      console.log('🆔 ID:', admin.id);
    } else {
      console.log('❌ Utente admin NON trovato nel database!');
      console.log('🔧 Creazione utente admin...');
      
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('Admin123!', 12);
      
      const newAdmin = await prisma.user.create({
        data: {
          nome: 'Amministratore',
          email: 'admin@incontriesescort.org',
          password: hashedPassword,
          ruolo: 'admin',
          slug: 'admin-system'
        }
      });
      
      console.log('✅ Utente admin creato!');
      console.log('📧 Email:', newAdmin.email);
      console.log('🔑 Password: Admin123!');
    }
    
    // Verifica tutti gli utenti
    const allUsers = await prisma.user.findMany({
      select: { id: true, nome: true, email: true, ruolo: true }
    });
    
    console.log('\n📋 Tutti gli utenti nel database:');
    allUsers.forEach(user => {
      console.log(`- ${user.email} (${user.ruolo}) - ID: ${user.id}`);
    });
    
  } catch (error) {
    console.error('❌ Errore debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAdmin();
