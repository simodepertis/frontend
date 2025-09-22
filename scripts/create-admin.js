const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('👑 Creazione utente admin...');
    
    const adminEmail = 'admin@incontriesescort.org';
    const adminPassword = 'Admin123!';
    const adminNome = 'Amministratore';
    
    // Verifica se esiste già
    const existing = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (existing) {
      console.log('⚠️ Utente admin già esistente:', adminEmail);
      
      // Aggiorna il ruolo se non è admin
      if (existing.ruolo !== 'admin') {
        await prisma.user.update({
          where: { id: existing.id },
          data: { ruolo: 'admin' }
        });
        console.log('✅ Ruolo aggiornato ad admin per:', adminEmail);
      }
      
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    // Crea admin
    const admin = await prisma.user.create({
      data: {
        nome: adminNome,
        email: adminEmail,
        password: hashedPassword,
        ruolo: 'admin'
      }
    });
    
    console.log('✅ Utente admin creato con successo!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('👤 ID:', admin.id);
    
    // Crea slug
    const slug = `admin-${admin.id}`;
    await prisma.user.update({
      where: { id: admin.id },
      data: { slug }
    });
    
    console.log('🎉 Setup admin completato!');
    
  } catch (error) {
    console.error('❌ Errore creazione admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
