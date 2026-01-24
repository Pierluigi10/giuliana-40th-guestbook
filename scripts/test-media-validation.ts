/**
 * Test script for media validation functions
 * Run with: npx tsx scripts/test-media-validation.ts
 */

import { validateMediaUrl } from '@/lib/media-validation'

console.log('🧪 Testing Media Validation Functions\n')

// Test 1: Valid Supabase URL
console.log('Test 1: Valid Supabase URL')
const validUrl = 'https://uukkrekcxlqfaaflmjwy.supabase.co/storage/v1/object/public/content-media/user123/test.jpg'
const result1 = validateMediaUrl(validUrl)
console.log('Input:', validUrl)
console.log('Result:', result1)
console.log('Expected: valid=true, filePath=user123/test.jpg')
console.log(result1.valid && result1.filePath === 'user123/test.jpg' ? '✅ PASS\n' : '❌ FAIL\n')

// Test 2: Invalid URL (wrong domain)
console.log('Test 2: Invalid URL (wrong domain)')
const invalidUrl1 = 'https://evil.com/storage/v1/object/public/content-media/user123/test.jpg'
const result2 = validateMediaUrl(invalidUrl1)
console.log('Input:', invalidUrl1)
console.log('Result:', result2)
console.log('Expected: valid=false, error contains "Supabase"')
console.log(!result2.valid && result2.error?.includes('Supabase') ? '✅ PASS\n' : '❌ FAIL\n')

// Test 3: Invalid URL (wrong path structure)
console.log('Test 3: Invalid URL (wrong path structure)')
const invalidUrl2 = 'https://uukkrekcxlqfaaflmjwy.supabase.co/storage/v1/object/public/wrong-bucket/test.jpg'
const result3 = validateMediaUrl(invalidUrl2)
console.log('Input:', invalidUrl2)
console.log('Result:', result3)
console.log('Expected: valid=false, error about missing file path')
console.log(!result3.valid && result3.error?.includes('percorso') ? '✅ PASS\n' : '❌ FAIL\n')

// Test 4: Invalid URL (malformed path - too many segments)
console.log('Test 4: Invalid URL (malformed path - too many segments)')
const invalidUrl3 = 'https://uukkrekcxlqfaaflmjwy.supabase.co/storage/v1/object/public/content-media/user/sub/folder/test.jpg'
const result4 = validateMediaUrl(invalidUrl3)
console.log('Input:', invalidUrl3)
console.log('Result:', result4)
console.log('Expected: valid=false, error about path structure')
console.log(!result4.valid && result4.error?.includes('struttura') ? '✅ PASS\n' : '❌ FAIL\n')

// Test 5: Malformed URL (not a URL at all)
console.log('Test 5: Malformed URL')
const invalidUrl4 = 'not-a-url'
const result5 = validateMediaUrl(invalidUrl4)
console.log('Input:', invalidUrl4)
console.log('Result:', result5)
console.log('Expected: valid=false, error about malformed URL')
console.log(!result5.valid && result5.error?.includes('malformato') ? '✅ PASS\n' : '❌ FAIL\n')

console.log('✅ All URL validation tests completed!')
