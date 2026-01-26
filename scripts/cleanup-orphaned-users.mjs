#!/usr/bin/env node

/**
 * Cleanup Orphaned Users Script
 *
 * Finds and removes orphaned users that exist in one place but not the other:
 * 1. Users in Supabase Auth but not in profiles table (can't re-register)
 * 2. Users in profiles table but not in Supabase Auth (dead data)
 *
 * Usage:
 *   node scripts/cleanup-orphaned-users.mjs --dry-run  # Show what would be deleted
 *   node scripts/cleanup-orphaned-users.mjs --fix      # Actually delete orphaned users
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
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Parse command line arguments
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run') || args.length === 0
const shouldFix = args.includes('--fix')

if (!isDryRun && !shouldFix) {
  console.log('Usage:')
  console.log('  node scripts/cleanup-orphaned-users.mjs --dry-run  # Show what would be deleted (default)')
  console.log('  node scripts/cleanup-orphaned-users.mjs --fix      # Actually delete orphaned users')
  process.exit(0)
}

console.log('🔍 Scanning for orphaned users...\n')

async function findOrphanedUsers() {
  // Get all users from Auth
  console.log('📋 Fetching users from Supabase Auth...')
  const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.error('❌ Error fetching auth users:', authError)
    process.exit(1)
  }

  console.log(`✅ Found ${authUsers.length} users in Auth`)

  // Get all profiles from database
  console.log('📋 Fetching profiles from database...')
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')

  if (profileError) {
    console.error('❌ Error fetching profiles:', profileError)
    process.exit(1)
  }

  console.log(`✅ Found ${profiles.length} profiles in database\n`)

  // Create sets for faster lookup
  const authUserIds = new Set(authUsers.map(u => u.id))
  const profileUserIds = new Set(profiles.map(p => p.id))
  const authEmails = new Set(authUsers.map(u => u.email?.toLowerCase()))

  // Find orphans: Auth users without profiles
  const orphanedAuthUsers = authUsers.filter(u => !profileUserIds.has(u.id))

  // Find orphans: Profiles without auth users
  const orphanedProfiles = profiles.filter(p => !authUserIds.has(p.id))

  return {
    authUsers,
    profiles,
    orphanedAuthUsers,
    orphanedProfiles,
    authEmails
  }
}

async function cleanupOrphanedAuthUsers(orphanedUsers, isDryRun) {
  if (orphanedUsers.length === 0) {
    console.log('✅ No orphaned auth users found!\n')
    return
  }

  console.log(`🚨 Found ${orphanedUsers.length} orphaned users in Auth (no profile):\n`)

  for (const user of orphanedUsers) {
    console.log(`  - ${user.email} (ID: ${user.id})`)
    console.log(`    Created: ${new Date(user.created_at).toLocaleString()}`)
    console.log(`    Last sign in: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}`)
  }

  if (isDryRun) {
    console.log(`\n⚠️  DRY RUN: Would delete ${orphanedUsers.length} users from Auth`)
    console.log('Run with --fix to actually delete these users\n')
    return
  }

  console.log(`\n🗑️  Deleting ${orphanedUsers.length} orphaned users from Auth...`)

  let successCount = 0
  let errorCount = 0

  for (const user of orphanedUsers) {
    try {
      const { error } = await supabase.auth.admin.deleteUser(user.id)
      if (error) {
        console.error(`  ❌ Failed to delete ${user.email}:`, error.message)
        errorCount++
      } else {
        console.log(`  ✅ Deleted ${user.email}`)
        successCount++
      }
    } catch (err) {
      console.error(`  ❌ Error deleting ${user.email}:`, err)
      errorCount++
    }
  }

  console.log(`\n✅ Deleted ${successCount} users from Auth`)
  if (errorCount > 0) {
    console.log(`⚠️  Failed to delete ${errorCount} users\n`)
  } else {
    console.log('')
  }
}

async function cleanupOrphanedProfiles(orphanedProfiles, isDryRun) {
  if (orphanedProfiles.length === 0) {
    console.log('✅ No orphaned profiles found!\n')
    return
  }

  console.log(`🚨 Found ${orphanedProfiles.length} orphaned profiles (no auth user):\n`)

  for (const profile of orphanedProfiles) {
    console.log(`  - ${profile.email} (${profile.full_name})`)
    console.log(`    ID: ${profile.id}`)
    console.log(`    Role: ${profile.role}`)
  }

  if (isDryRun) {
    console.log(`\n⚠️  DRY RUN: Would delete ${orphanedProfiles.length} profiles from database`)
    console.log('Run with --fix to actually delete these profiles\n')
    return
  }

  console.log(`\n🗑️  Deleting ${orphanedProfiles.length} orphaned profiles from database...`)

  let successCount = 0
  let errorCount = 0

  for (const profile of orphanedProfiles) {
    try {
      // Delete reactions first (foreign key constraint)
      await supabase
        .from('reactions')
        .delete()
        .eq('user_id', profile.id)

      // Delete content
      const { data: content } = await supabase
        .from('content')
        .select('media_url')
        .eq('user_id', profile.id)

      // Delete media files
      if (content && content.length > 0) {
        for (const item of content) {
          if (item.media_url) {
            const urlParts = item.media_url.split('/content-media/')
            if (urlParts.length === 2) {
              await supabase.storage.from('content-media').remove([urlParts[1]])
            }
          }
        }
      }

      // Delete content records
      await supabase
        .from('content')
        .delete()
        .eq('user_id', profile.id)

      // Delete profile
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profile.id)

      if (error) {
        console.error(`  ❌ Failed to delete ${profile.email}:`, error.message)
        errorCount++
      } else {
        console.log(`  ✅ Deleted ${profile.email}`)
        successCount++
      }
    } catch (err) {
      console.error(`  ❌ Error deleting ${profile.email}:`, err)
      errorCount++
    }
  }

  console.log(`\n✅ Deleted ${successCount} profiles from database`)
  if (errorCount > 0) {
    console.log(`⚠️  Failed to delete ${errorCount} profiles\n`)
  } else {
    console.log('')
  }
}

async function main() {
  const { orphanedAuthUsers, orphanedProfiles } = await findOrphanedUsers()

  // Cleanup orphaned auth users (users without profiles)
  await cleanupOrphanedAuthUsers(orphanedAuthUsers, isDryRun)

  // Cleanup orphaned profiles (profiles without auth users)
  await cleanupOrphanedProfiles(orphanedProfiles, isDryRun)

  if (isDryRun) {
    console.log('💡 Tip: Run with --fix to actually delete these orphaned users')
  } else {
    console.log('✅ Cleanup complete!')
  }
}

main().catch(err => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
