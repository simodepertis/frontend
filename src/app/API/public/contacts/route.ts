import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// GET - Recupera contatti pubblici per la pagina contatti
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'src', 'config', 'siteContacts.json');
    const content = await fs.readFile(filePath, 'utf8');
    const json = JSON.parse(content);
    return NextResponse.json(json);
  } catch (error) {
    console.error('❌ ERRORE in GET /api/public/contacts:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero dei contatti' },
      { status: 500 }
    );
  }
}
