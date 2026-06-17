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

export function getBottomNavAnchor(): HTMLElement {
  return document.getElementById('bottom-nav-anchor') ?? document.body
}

/** iOS: sync viewport height for #root only (not nav positioning). */
export function syncViewportHeight(): void {
  const height = window.innerHeight
  document.documentElement.style.setProperty('--app-height', `${Math.round(height)}px`)
}

export function initViewportSync(): void {
  const update = () => syncViewportHeight()

  update()
  window.addEventListener('resize', update)
  window.addEventListener('orientationchange', update)
  window.addEventListener('pageshow', update)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') update()
  })
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
