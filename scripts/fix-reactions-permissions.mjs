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
  console.log('🚀 Fixing reactions permissions...\n')

  try {
    // Read the migration file
    const migrationPath = resolve(process.cwd(), 'supabase/migrations/007_fix_reactions_permissions.sql')
    const sql = readFileSync(migrationPath, 'utf-8')

    console.log('📝 Executing migration SQL...')

    // Split SQL into individual statements (excluding DO blocks)
    const statements = []
    let currentStatement = ''
    let inDoBlock = false

    for (const line of sql.split('\n')) {
      if (line.trim().startsWith('DO $$')) {
        inDoBlock = true
        currentStatement = line + '\n'
      } else if (inDoBlock && line.trim() === '$$;') {
        currentStatement += line
        statements.push(currentStatement)
        currentStatement = ''
        inDoBlock = false
      } else if (inDoBlock) {
        currentStatement += line + '\n'
      } else if (line.trim() && !line.trim().startsWith('--')) {
        currentStatement += line + '\n'
        if (line.includes(';') && !inDoBlock) {
          statements.push(currentStatement)
          currentStatement = ''
        }
      }
    }

    // Execute each statement
    for (const statement of statements) {
      const trimmed = statement.trim()
      if (!trimmed) continue

      console.log(`Executing: ${trimmed.substring(0, 50)}...`)

      const { error } = await supabase.rpc('query', {
        query_text: trimmed
      })

      if (error) {
        console.log('⚠️  RPC failed, trying alternative method...')

        // Try using SQL editor approach via REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ query_text: trimmed })
        })

        if (!response.ok) {
          console.error('❌ Error executing statement')
          console.log('\n📋 Please run this migration manually in Supabase SQL Editor:')
          console.log(sql)
          return
        }
      }
    }

    console.log('✅ Migration completed successfully!')
    console.log('\n🎉 All authenticated users can now add reactions to content.')
    console.log('   Test it by logging in as a guest and trying to add a reaction.')

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.log('\n📋 Please run the migration manually:')
    console.log('   1. Open Supabase Dashboard → SQL Editor')
    console.log('   2. Copy content from: supabase/migrations/007_fix_reactions_permissions.sql')
    console.log('   3. Paste and execute')
    process.exit(1)
  }
}

runMigration()
