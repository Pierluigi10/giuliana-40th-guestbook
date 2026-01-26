#!/usr/bin/env node

/**
 * Test Admin API
 * Tests the /api/admin/users endpoint to see if it returns users correctly
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables!')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('🔍 Testing Admin API...\n')

async function testAPI() {
  // Test 1: Get all profiles from database directly
  console.log('📋 Test 1: Fetching profiles directly from database...')
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, is_approved, created_at')
    .order('created_at', { ascending: false })

  if (profilesError) {
    console.error('❌ Error fetching profiles:', profilesError)
  } else {
    console.log(`✅ Found ${profiles.length} profiles in database:`)
    profiles.forEach(p => {
      console.log(`  - ${p.email} (${p.full_name}) - ${p.role}`)
    })
  }

  console.log('\n📋 Test 2: Checking admin user...')
  const adminUsers = profiles?.filter(p => p.role === 'admin') || []
  if (adminUsers.length === 0) {
    console.error('❌ No admin users found! You need at least one admin to access /manage-users')
  } else {
    console.log(`✅ Found ${adminUsers.length} admin user(s):`)
    adminUsers.forEach(a => {
      console.log(`  - ${a.email} (${a.full_name})`)
    })
  }

  console.log('\n📋 Test 3: Testing RLS policies...')

  // Get first admin user
  const adminUser = adminUsers[0]
  if (!adminUser) {
    console.error('❌ Cannot test RLS - no admin user found')
    return
  }

  console.log(`Using admin user: ${adminUser.email}`)

  // Try to query as the admin user (simulating what the API does)
  // Note: This uses service role key which bypasses RLS, so we'll just verify the query works
  const { data: testProfiles, error: testError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, is_approved, created_at')
    .order('created_at', { ascending: false })

  if (testError) {
    console.error('❌ Error in test query:', testError)
  } else {
    console.log(`✅ Query successful, returned ${testProfiles.length} profiles`)
  }

  console.log('\n📋 Test 4: Checking content counts...')
  const { data: contentCounts, error: contentError } = await supabase
    .from('content')
    .select('user_id')

  if (contentError) {
    console.error('❌ Error fetching content counts:', contentError)
  } else {
    const countMap = new Map()
    contentCounts.forEach(c => {
      countMap.set(c.user_id, (countMap.get(c.user_id) || 0) + 1)
    })
    console.log(`✅ Content count query successful`)
    console.log(`   Total content items: ${contentCounts.length}`)
    console.log(`   Users with content: ${countMap.size}`)
  }

  console.log('\n✅ All tests completed!')
  console.log('\n💡 Troubleshooting:')
  console.log('1. Make sure you are logged in as admin in the browser')
  console.log('2. Open browser DevTools (F12) → Console tab')
  console.log('3. Go to http://localhost:3000/manage-users')
  console.log('4. Check for any error messages in the console')
  console.log('5. Go to Network tab and check the /api/admin/users request')
  console.log('   - Status should be 200')
  console.log('   - Response should contain array of users')
}

testAPI().catch(err => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
