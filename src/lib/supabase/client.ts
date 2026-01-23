import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import type { TypedSupabaseClient } from './types'

export function createClient(): TypedSupabaseClient {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) as TypedSupabaseClient
}
