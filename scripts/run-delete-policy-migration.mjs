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

    console.log('📝 Attempting to execute migration SQL...\n')

    // Try using REST API directly with fetch
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s.length > 0)

    let successCount = 0

    for (const statement of statements) {
      if (!statement) continue

      console.log(`Executing: ${statement.substring(0, 60)}...`)

      try {
        // Try using PostgREST query endpoint (won't work for DDL, but worth trying)
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ query: statement })
        })

        if (response.ok) {
          successCount++
          console.log('   ✅ Success')
        } else {
          const errorText = await response.text()
          console.log(`   ⚠️  Failed: ${response.status} - ${errorText.substring(0, 100)}`)
        }
      } catch (fetchError) {
        console.log(`   ⚠️  Error: ${fetchError.message}`)
      }
    }

    if (successCount === statements.length) {
      console.log('\n✅ Migration completed successfully!')
      console.log('\n🎉 Users can now delete their own content, and VIP/Admin can delete any content.')
      return
    }

    // If automatic execution failed, show manual instructions
    console.log('\n⚠️  Automatic execution failed or partially failed.')
    console.log('   Supabase does not expose a public API for executing arbitrary SQL.')
    console.log('   Please run this migration manually:\n')
    console.log('═'.repeat(70))
    console.log('📋 MANUAL INSTRUCTIONS')
    console.log('═'.repeat(70))
    console.log('\n1. Open Supabase Dashboard:')
    console.log('   https://supabase.com/dashboard/project/[YOUR_PROJECT]/sql/new\n')
    console.log('2. Copy and paste this SQL:\n')
    console.log('─'.repeat(70))
    console.log(sql)
    console.log('─'.repeat(70))
    console.log('\n3. Click "Run" to execute\n')
    console.log('═'.repeat(70))

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.log('\n📋 Please run the migration manually in Supabase SQL Editor')
  }
}

runMigration()
