/**
 * Script per creare il bucket "content-media" su Supabase
 *
 * Esegui con: npm run setup:storage
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Errore: variabili d\'ambiente mancanti!')
  console.error('   Assicurati che .env.local contenga:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

async function setupStorageBucket() {
  console.log('🚀 Setup bucket "content-media" su Supabase...\n')

  // Usa service_role key per avere permessi admin
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // 1. Verifica se il bucket esiste già
  console.log('1️⃣  Verifico bucket esistente...')
  const { data: existingBuckets } = await supabase.storage.listBuckets()
  const bucketExists = existingBuckets?.some(b => b.id === 'content-media')

  if (bucketExists) {
    console.log('✅ Bucket "content-media" già esistente!')
    console.log('\n✨ Setup completato! Puoi procedere con l\'upload.')
    return
  }

  // 2. Crea il bucket
  console.log('2️⃣  Creo bucket "content-media"...')
  const { data: bucket, error: bucketError } = await supabase.storage.createBucket('content-media', {
    public: true,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'video/webm'
    ]
  })

  if (bucketError) {
    console.error('❌ Errore nella creazione del bucket:', bucketError)
    console.error('\n🔧 Soluzione alternativa:')
    console.error('   1. Vai su: https://supabase.com/dashboard/project/uukkrekcxlqfaaflmjwy/storage/buckets')
    console.error('   2. Clicca "New bucket"')
    console.error('   3. Nome: content-media')
    console.error('   4. Pubblico: ON')
    console.error('   5. File size limit: 10MB')
    process.exit(1)
  }

  console.log('✅ Bucket creato con successo!')

  // 3. Leggi e esegui le policy SQL
  console.log('\n3️⃣  Applico policy RLS...')
  console.log('⚠️  Le policy RLS devono essere configurate manualmente via SQL Editor')
  console.log('\n📋 Prossimi passi:')
  console.log('   1. Vai su: https://supabase.com/dashboard/project/uukkrekcxlqfaaflmjwy/editor/sql')
  console.log('   2. Copia il contenuto del file: supabase/migrations/005_storage_bucket_and_policies.sql')
  console.log('   3. Incolla ed esegui dalla riga 18 in poi (le policy RLS)')
  console.log('   4. Testa l\'upload dall\'app! 🎉')

  console.log('\n✅ Setup bucket completato!')
}

setupStorageBucket().catch(console.error)
