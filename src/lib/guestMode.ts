import type { User } from '@supabase/supabase-js'

export const GUEST_SESSION_KEY = 'gymtrack-guest-mode'
export const GUEST_USER_ID = '00000000-0000-0000-0000-000000000001'

export const GUEST_USER = {
  id: GUEST_USER_ID,
  aud: 'authenticated',
  role: 'authenticated',
  email: 'gast@gymtrack.demo',
  email_confirmed_at: new Date().toISOString(),
  phone: '',
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: { provider: 'guest', providers: ['guest'] },
  user_metadata: { display_name: 'Gast' },
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_anonymous: false,
} as User

export function isGuestSession(): boolean {
  try {
    return sessionStorage.getItem(GUEST_SESSION_KEY) === '1'
  } catch {
    return false
  }
}

export function enableGuestSession(): void {
  sessionStorage.setItem(GUEST_SESSION_KEY, '1')
}

export function disableGuestSession(): void {
  sessionStorage.removeItem(GUEST_SESSION_KEY)
}
