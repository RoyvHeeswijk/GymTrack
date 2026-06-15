export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return (
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const nav = navigator as Navigator & { standalone?: boolean }
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    nav.standalone === true
  )
}

/** Zet platform-classes op html voor iOS/PWA-specifieke CSS (safe-area). */
export function applyDeviceClasses(): void {
  const root = document.documentElement
  if (isIOS()) root.classList.add('ios')
  if (isIOS() && isStandalone()) {
    root.classList.add('ios-standalone')
    root.dataset.display = 'standalone'
  }
}
