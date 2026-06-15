export interface AppSettings {
  showCoachTips: boolean
  showMuscleFocus: boolean
  lightMode: boolean
}

const STORAGE_KEY = 'gymtrack-settings'

const DEFAULTS: AppSettings = {
  showCoachTips: true,
  showMuscleFocus: true,
  lightMode: false,
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<AppSettings>) }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export const LOG_SESSION_KEY = 'gymtrack-log-session'

/** Wis lokale log-sessie (o.a. na prototype-reset). */
export function clearPrototypeLocalState(): void {
  sessionStorage.removeItem(LOG_SESSION_KEY)
}
