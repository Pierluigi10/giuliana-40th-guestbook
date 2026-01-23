#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('🚀 Running DELETE policy migration...\n')

  try {
    // Read the migration file
    const migrationPath = resolve(process.cwd(), 'supabase/migrations/006_update_delete_policies.sql')
    const sql = readFileSync(migrationPath, 'utf-8')

    console.log('📝 Executing migration SQL...')

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).single()

    if (error) {
      // Try direct execution via REST API
      console.log('⚠️  RPC method failed, trying direct execution...')

      // Split SQL into individual statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'))

      for (const statement of statements) {
        if (!statement) continue

        const { error: execError } = await supabase.rpc('exec', {
          query: statement + ';'
        })

        if (execError) {
          console.error('❌ Error executing statement:', execError.message)
          console.log('\n📋 Please run this migration manually in Supabase SQL Editor:')
          console.log(sql)
          return
        }
      }
    }

    console.log('✅ Migration completed successfully!')
    console.log('\n🎉 VIP and Admin can now delete content from the gallery.')
    console.log('   Test it by logging in as VIP or Admin and trying to delete a content item.')

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.log('\n📋 Please run the migration manually:')
    console.log('   1. Open Supabase Dashboard → SQL Editor')
    console.log('   2. Copy content from: supabase/migrations/006_update_delete_policies.sql')
    console.log('   3. Paste and execute')
  }
}

runMigration()
