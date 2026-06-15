const PRODUCTION_APP_URL = 'https://gym-track-bice.vercel.app'

/** URL waar Supabase na e-mailbevestiging naartoe stuurt. */
export function getAuthRedirectUrl(): string {
  const configured = (import.meta.env.VITE_APP_URL as string | undefined)?.trim()
  if (configured) return configured.replace(/\/$/, '')

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return PRODUCTION_APP_URL
}

export function getEmailConfirmRedirectUrl(): string {
  return `${getAuthRedirectUrl()}/`
}
