import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables are not configured.')
  }
  _supabase = createClient(supabaseUrl, supabaseKey)
  return _supabase
}
