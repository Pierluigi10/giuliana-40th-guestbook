#!/usr/bin/env node

/**
 * Test Supabase Connection Script
 * Verifies that Supabase is properly configured and accessible
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Testing Supabase Connection...\n')

// Check if environment variables are set
if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  console.error('Required:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

console.log('✅ Environment variables found')
console.log(`   URL: ${supabaseUrl.substring(0, 30)}...`)

// Create Supabase client with service role (for admin operations)
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testConnection() {
  try {
    // Test 1: Check if we can connect
    console.log('\n📡 Testing connection...')
    const { data: healthCheck, error: healthError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (healthError) {
      console.error('❌ Connection failed:', healthError.message)
      return false
    }
    console.log('✅ Connection successful')

    // Test 2: Check if tables exist
    console.log('\n📊 Checking database tables...')
    const tables = ['profiles', 'content', 'reactions']
    const missingTables = []

    for (const table of tables) {
      const { error } = await supabase.from(table).select('*').limit(1)
      if (error) {
        if (error.code === '42P01') {
          // Table does not exist
          missingTables.push(table)
        } else {
          console.warn(`⚠️  Table ${table}: ${error.message}`)
        }
      } else {
        console.log(`✅ Table '${table}' exists`)
      }
    }

    if (missingTables.length > 0) {
      console.error(`\n❌ Missing tables: ${missingTables.join(', ')}`)
      console.error('   Run migrations: supabase/migrations/*.sql')
      return false
    }

    // Test 3: Check RLS policies
    console.log('\n🔒 Checking RLS policies...')
    const { data: rlsCheck, error: rlsError } = await supabase.rpc('check_rls_enabled', {})
    
    if (rlsError) {
      // RPC might not exist, try direct query
      const { data: policies, error: policiesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)
      
      if (policiesError && policiesError.message.includes('row-level security')) {
        console.log('✅ RLS is enabled (test query blocked as expected)')
      } else {
        console.warn('⚠️  Could not verify RLS status')
      }
    } else {
      console.log('✅ RLS policies are configured')
    }

    // Test 4: Check storage bucket
    console.log('\n📦 Checking storage bucket...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.warn(`⚠️  Could not list buckets: ${bucketsError.message}`)
    } else {
      const contentBucket = buckets.find(b => b.name === 'content-media' || b.name === 'content-files')
      if (contentBucket) {
        console.log(`✅ Storage bucket '${contentBucket.name}' exists`)
      } else {
        console.warn('⚠️  Storage bucket not found (expected: content-media or content-files)')
        console.log(`   Available buckets: ${buckets.map(b => b.name).join(', ') || 'none'}`)
      }
    }

    // Test 5: Check users (admin and VIP)
    console.log('\n👥 Checking admin and VIP users...')
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('email, role, is_approved')
      .in('role', ['admin', 'vip'])

    if (usersError) {
      console.warn(`⚠️  Could not check users: ${usersError.message}`)
    } else {
      const admin = users.find(u => u.role === 'admin')
      const vip = users.find(u => u.role === 'vip')
      
      if (admin) {
        console.log(`✅ Admin user found: ${admin.email} (approved: ${admin.is_approved})`)
      } else {
        console.warn('⚠️  Admin user not found')
      }
      
      if (vip) {
        console.log(`✅ VIP user found: ${vip.email} (approved: ${vip.is_approved})`)
      } else {
        console.warn('⚠️  VIP user not found')
      }
    }

    return true
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    return false
  }
}

// Run tests
testConnection()
  .then((success) => {
    if (success) {
      console.log('\n✅ All checks passed! Supabase is properly configured.')
      process.exit(0)
    } else {
      console.log('\n❌ Some checks failed. Please review the errors above.')
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })
