import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Type-safe wrapper for Supabase queries
 * Ensures proper typing for database operations
 */

export type TypedSupabaseClient = SupabaseClient<Database>

// Content table helpers
export type ContentRow = Database['public']['Tables']['content']['Row']
export type ContentInsert = Database['public']['Tables']['content']['Insert']
export type ContentUpdate = Database['public']['Tables']['content']['Update']

// Reactions table helpers
export type ReactionRow = Database['public']['Tables']['reactions']['Row']
export type ReactionInsert = Database['public']['Tables']['reactions']['Insert']
export type ReactionUpdate = Database['public']['Tables']['reactions']['Update']

// Profiles table helpers
export type ProfileRow = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

/**
 * Ensures the supabase client is properly typed
 * This is a simple identity function that helps with type inference
 */
export function ensureTypedClient(client: TypedSupabaseClient): TypedSupabaseClient {
  return client
}
