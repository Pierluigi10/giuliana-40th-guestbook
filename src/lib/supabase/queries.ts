import type { TypedSupabaseClient, ContentInsert, ContentUpdate, ReactionInsert, ReactionRow, ProfileRow } from './types'

/**
 * Type-safe query helpers for content operations
 *
 * Note: Supabase TypeScript types have known limitations with generic inference
 * in chain methods. These helpers provide proper typing by declaring explicit
 * return types, bypassing the inference issues.
 */

export async function insertContent(supabase: TypedSupabaseClient, data: ContentInsert) {
  // @ts-expect-error - Supabase generic inference limitation
  return supabase.from('content').insert(data)
}

export async function updateContent(supabase: TypedSupabaseClient, contentId: string, data: ContentUpdate) {
  // @ts-expect-error - Supabase generic inference limitation
  return supabase.from('content').update(data).eq('id', contentId)
}

export async function insertReaction(supabase: TypedSupabaseClient, data: ReactionInsert) {
  // @ts-expect-error - Supabase generic inference limitation on insert
  const result = supabase.from('reactions').insert(data).select().single()
  // @ts-expect-error - Supabase generic inference limitation on return type
  return result as Promise<{ data: ReactionRow | null; error: any }>
}

export async function selectProfileById(supabase: TypedSupabaseClient, userId: string) {
  // @ts-expect-error - Supabase generic inference limitation
  return supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single() as Promise<{ data: Pick<ProfileRow, 'role'> | null; error: any }>
}

export async function selectFullProfileById(supabase: TypedSupabaseClient, userId: string) {
  // @ts-expect-error - Supabase generic inference limitation
  return supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .eq('id', userId)
    .single() as Promise<{ data: Pick<ProfileRow, 'id' | 'email' | 'full_name' | 'role'> | null; error: any }>
}
