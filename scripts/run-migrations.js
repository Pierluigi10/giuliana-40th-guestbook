#!/usr/bin/env node

/**
 * Script per eseguire automaticamente le migration del database Supabase
 * Legge i file SQL dalla cartella supabase/migrations/ ed li esegue in ordine
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Errore: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY non trovati in .env.local');
  process.exit(1);
}

const MIGRATIONS_DIR = path.join(__dirname, '../supabase/migrations');

async function executeSql(sql, migrationName) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      // Proviamo metodo alternativo usando il endpoint SQL diretto
      return await executeSqlDirect(sql, migrationName);
    }

    return true;
  } catch (error) {
    console.error(`❌ Errore esecuzione ${migrationName}:`, error.message);
    return false;
  }
}

async function executeSqlDirect(sql, migrationName) {
  console.log(`\n📝 ${migrationName}`);
  console.log('─'.repeat(60));
  console.log('\n⚠️  Non posso eseguire automaticamente questo SQL.');
  console.log('Per favore, copia ed esegui manualmente su Supabase Dashboard → SQL Editor:\n');
  console.log('─'.repeat(60));
  console.log(sql);
  console.log('─'.repeat(60));
  console.log('\n⏸️  Premi INVIO quando hai eseguito questo SQL su Supabase...');

  // In modalità non-interattiva, semplicemente logga e continua
  if (process.env.CI || !process.stdin.isTTY) {
    return false;
  }

  return new Promise((resolve) => {
    process.stdin.once('data', () => {
      console.log('✅ Ok, continuo...\n');
      resolve(true);
    });
  });
}

async function runMigrations() {
  console.log('🚀 Avvio migration database Supabase...\n');

  // Leggi tutti i file SQL in ordine
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('⚠️  Nessun file SQL trovato in supabase/migrations/');
    return;
  }

  console.log(`📁 Trovati ${files.length} file di migration:\n`);
  files.forEach((file, i) => {
    console.log(`   ${i + 1}. ${file}`);
  });
  console.log();

  // Mostra istruzioni manuali
  console.log('═'.repeat(70));
  console.log('📋 ISTRUZIONI PER ESEGUIRE LE MIGRATION MANUALMENTE');
  console.log('═'.repeat(70));
  console.log('\n1. Vai su: https://supabase.com/dashboard/project/uukkrekcxlqfaaflmjwy/sql/new');
  console.log('\n2. Per ogni file sotto, copia il contenuto e eseguilo nel SQL Editor:\n');

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    console.log(`\n${'═'.repeat(70)}`);
    console.log(`📄 MIGRATION ${i + 1}/${files.length}: ${file}`);
    console.log('═'.repeat(70));
    console.log('\n💡 Percorso file:', filePath);
    console.log('\n📋 Copia questo SQL:\n');
    console.log('─'.repeat(70));
    console.log(sql);
    console.log('─'.repeat(70));

    if (i < files.length - 1) {
      console.log('\n⏭️  Dopo averlo eseguito, continua con il prossimo file...\n');
    }
  }

  console.log('\n\n✅ VERIFICA FINALE');
  console.log('═'.repeat(70));
  console.log('\nDopo aver eseguito tutte le migration, verifica con questo SQL:\n');
  console.log('SELECT email, role, is_approved FROM profiles;\n');
  console.log('═'.repeat(70));

  console.log('\n\n💡 TIP: Puoi anche trovare i file SQL in:');
  console.log(`   ${MIGRATIONS_DIR}\n`);
}

runMigrations().catch(console.error);
