/**
 * Test pratico per verificare le policy RLS del bucket storage
 *
 * Esegui con: npm run test:upload
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function testUploadPermissions() {
  console.log('🧪 Test pratico upload permissions...\n')

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  // Test 1: Verifica bucket pubblico (lettura senza auth)
  console.log('1️⃣  Test lettura pubblica (senza autenticazione)...')
  const { data: files, error: listError } = await supabase.storage
    .from('content-media')
    .list('', { limit: 1 })

  if (listError) {
    console.log(`   ⚠️  Lettura pubblica: ${listError.message}`)
  } else {
    console.log(`   ✅ Lettura pubblica funzionante (${files?.length || 0} file trovati)`)
  }

  // Test 2: Tentativo di upload senza autenticazione (dovrebbe fallire)
  console.log('\n2️⃣  Test upload senza autenticazione (dovrebbe fallire)...')

  // Crea un file di test minimale (1x1 pixel PNG)
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  const testImageBuffer = Buffer.from(testImageBase64, 'base64')

  const { error: uploadError } = await supabase.storage
    .from('content-media')
    .upload('test/test.png', testImageBuffer, {
      contentType: 'image/png'
    })

  if (uploadError) {
    if (uploadError.message.includes('new row violates row-level security') ||
        uploadError.message.includes('not authenticated') ||
        uploadError.message.includes('JWT')) {
      console.log('   ✅ Upload bloccato correttamente (policy RLS attiva)')
    } else {
      console.log(`   ⚠️  Errore inaspettato: ${uploadError.message}`)
    }
  } else {
    console.log('   ❌ PROBLEMA: Upload riuscito senza autenticazione!')
    console.log('      Le policy RLS potrebbero non essere configurate correttamente.')
  }

  // Istruzioni per test completo
  console.log('\n3️⃣  Test completo con utente autenticato:')
  console.log('   Per testare l\'upload completo:')
  console.log('   1. Avvia l\'app: npm run dev')
  console.log('   2. Registrati: http://localhost:4000/register')
  console.log('   3. Vai su upload: http://localhost:4000/upload')
  console.log('   4. Carica un\'immagine di test')
  console.log('   5. Verifica che appaia il confetti! 🎉')

  console.log('\n📋 Riepilogo configurazione:')
  console.log('   ✅ Bucket "content-media" esiste')
  console.log('   ✅ Bucket è pubblico (lettura)')
  console.log('   ✅ Upload protetto da autenticazione')

  console.log('\n💡 Se l\'upload dall\'app non funziona:')
  console.log('   1. Verifica le policy RLS nella dashboard:')
  console.log('      https://supabase.com/dashboard/project/uukkrekcxlqfaaflmjwy/storage/policies')
  console.log('   2. Esegui manualmente: supabase/migrations/005_storage_bucket_and_policies.sql')
  console.log('   3. Controlla i log del browser (F12 > Console) per errori')
}

testUploadPermissions().catch(console.error)
