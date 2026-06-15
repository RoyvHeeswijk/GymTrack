const PRODUCTION_APP_URL = 'https://gym-track-bice.vercel.app'

function isLocalhost(url: string): boolean {
  try {
    const host = new URL(url).hostname
    return host === 'localhost' || host === '127.0.0.1'
  } catch {
    return false
  }
}

/** URL waar Supabase na e-mailbevestiging naartoe stuurt. */
export function getAuthRedirectUrl(): string {
  const configured = (import.meta.env.VITE_APP_URL as string | undefined)?.trim()
  if (configured?.startsWith('http')) {
    const url = configured.replace(/\/$/, '')
    if (import.meta.env.PROD && isLocalhost(url)) return PRODUCTION_APP_URL
    return url
  }

  if (typeof window !== 'undefined') {
    const origin = window.location.origin
    if (import.meta.env.PROD && isLocalhost(origin)) return PRODUCTION_APP_URL
    return origin
  }

  return PRODUCTION_APP_URL
}

export function getEmailConfirmRedirectUrl(): string {
  return `${getAuthRedirectUrl()}/`
}
