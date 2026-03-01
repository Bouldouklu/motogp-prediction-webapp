import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Service role client — bypasses RLS.
 * Use ONLY in admin API routes that have already verified admin auth.
 */
export function createServiceClient() {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SERVICE_ROLE_KEY!
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key)
}
