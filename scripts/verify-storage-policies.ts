/**
 * Script per verificare le policy RLS del bucket storage
 *
 * Esegui con: npm run verify:storage
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function verifyStoragePolicies() {
  console.log('🔍 Verifica policy RLS per storage.objects...\n')

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Query per verificare le policy RLS
  const { data: policies, error } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('schemaname', 'storage')
    .eq('tablename', 'objects')

  if (error) {
    console.error('❌ Errore nel recupero delle policy:', error.message)
    console.log('\n⚠️  Potrebbe essere necessario eseguire questa query manualmente:')
    console.log('   SELECT * FROM pg_policies WHERE schemaname = \'storage\' AND tablename = \'objects\';')
    return
  }

  console.log(`📋 Policy trovate: ${policies?.length || 0}\n`)

  const requiredPolicies = [
    'Authenticated users can upload files',
    'Users can view media',
    'Admin can delete files',
    'Users can update own files'
  ]

  const policyNames = policies?.map((p: any) => p.policyname) || []

  console.log('✅ Policy configurate:')
  requiredPolicies.forEach(name => {
    const exists = policyNames.includes(name)
    console.log(`   ${exists ? '✅' : '❌'} ${name}`)
  })

  const missingPolicies = requiredPolicies.filter(name => !policyNames.includes(name))

  if (missingPolicies.length > 0) {
    console.log('\n⚠️  Policy mancanti!')
    console.log('\n🔧 Azione richiesta:')
    console.log('   1. Vai su: https://supabase.com/dashboard/project/uukkrekcxlqfaaflmjwy/editor/sql')
    console.log('   2. Esegui il file: supabase/migrations/005_storage_bucket_and_policies.sql')
    console.log('   3. Esegui di nuovo questo script per verificare')
    return
  }

  console.log('\n✅ Tutte le policy RLS sono configurate correttamente!')
  console.log('\n💡 Prossimi passi:')
  console.log('   1. Avvia l\'app: npm run dev')
  console.log('   2. Registrati come utente: http://localhost:4000/register')
  console.log('   3. Testa l\'upload: http://localhost:4000/upload')
  console.log('   4. Goditi i confetti! 🎉')
}

verifyStoragePolicies().catch(console.error)
