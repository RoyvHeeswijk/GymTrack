import { supabase } from './supabase'

export interface UserProfile {
  id: string
  display_name: string
  created_at: string
  updated_at: string
}

export function defaultDisplayName(email?: string | null): string {
  if (!email) return 'Atleet'
  const local = email.split('@')[0]
  return local.charAt(0).toUpperCase() + local.slice(1)
}

export function profileDisplayName(profile: UserProfile | null, email?: string | null): string {
  const trimmed = profile?.display_name.trim()
  if (trimmed) return trimmed
  return defaultDisplayName(email)
}

export function profileInitial(profile: UserProfile | null, email?: string | null): string {
  return profileDisplayName(profile, email).charAt(0).toUpperCase() || '?'
}

export async function fetchProfile(userId: string, email?: string | null): Promise<UserProfile> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  if (data) return data as UserProfile

  const display_name = defaultDisplayName(email)
  const { data: created, error: insertError } = await supabase
    .from('profiles')
    .insert({ id: userId, display_name })
    .select()
    .single()
  if (insertError) throw insertError
  return created as UserProfile
}

export async function updateProfileDisplayName(userId: string, displayName: string): Promise<UserProfile> {
  const trimmed = displayName.trim()
  if (!trimmed) throw new Error('Gebruikersnaam mag niet leeg zijn.')

  const { data, error } = await supabase
    .from('profiles')
    .update({ display_name: trimmed, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data as UserProfile
}
