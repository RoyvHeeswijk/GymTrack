import { createClient } from '@supabase/supabase-js'

const PLACEHOLDER_URL = 'https://placeholder.supabase.co'
const PLACEHOLDER_KEY = 'placeholder'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()

function isValidSupabaseUrl(url: string | undefined): url is string {
  return Boolean(url && url.startsWith('https://') && !url.includes('jouw-project'))
}

function isValidAnonKey(key: string | undefined): key is string {
  return Boolean(key && key !== 'jouw-anon-key' && key.length > 20)
}

export const isSupabaseConfigured = isValidSupabaseUrl(supabaseUrl) && isValidAnonKey(supabaseAnonKey)

export const supabase = createClient(
  isValidSupabaseUrl(supabaseUrl) ? supabaseUrl : PLACEHOLDER_URL,
  isValidAnonKey(supabaseAnonKey) ? supabaseAnonKey : PLACEHOLDER_KEY,
)
