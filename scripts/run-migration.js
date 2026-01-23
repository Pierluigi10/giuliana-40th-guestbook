#!/usr/bin/env node

/**
 * Script to run SQL migration via Supabase REST API
 * Usage: node scripts/run-migration.js supabase/migrations/005_storage_bucket_and_policies.sql
 */

const fs = require('fs')
const path = require('path')
const https = require('https')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

// Get migration file path from command line
const migrationFile = process.argv[2]
if (!migrationFile) {
  console.error('❌ Usage: node scripts/run-migration.js <path-to-migration.sql>')
  process.exit(1)
}

// Read migration file
const migrationPath = path.resolve(process.cwd(), migrationFile)
if (!fs.existsSync(migrationPath)) {
  console.error(`❌ Migration file not found: ${migrationPath}`)
  process.exit(1)
}

const sql = fs.readFileSync(migrationPath, 'utf-8')
console.log(`📄 Running migration: ${path.basename(migrationFile)}`)
console.log(`📍 From: ${migrationPath}\n`)

// Parse URL
const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`)

// Prepare request
const postData = JSON.stringify({ query: sql })

const options = {
  hostname: url.hostname,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Length': Buffer.byteLength(postData)
  }
}

// Make request
const req = https.request(options, (res) => {
  let data = ''

  res.on('data', (chunk) => {
    data += chunk
  })

  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Migration executed successfully!')
      console.log('\n📊 Response:', data)
    } else {
      console.error(`❌ Migration failed with status ${res.statusCode}`)
      console.error('Response:', data)
      process.exit(1)
    }
  })
})

req.on('error', (error) => {
  console.error('❌ Request error:', error.message)
  process.exit(1)
})

req.write(postData)
req.end()
