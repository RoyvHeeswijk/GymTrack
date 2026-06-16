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

/** iOS PWA: sync real viewport height (dvh is unreliable after resume). */
export function syncViewportHeight(): void {
  const height = window.visualViewport?.height ?? window.innerHeight
  document.documentElement.style.setProperty('--app-height', `${Math.round(height)}px`)
}

export function pinBottomNav(): void {
  document.querySelectorAll<HTMLElement>('.bottom-nav').forEach((el) => {
    el.style.position = 'fixed'
    el.style.left = '0'
    el.style.right = '0'
    el.style.bottom = '0'
    el.style.zIndex = '10000'
  })
}

export function initViewportSync(): void {
  const update = () => {
    syncViewportHeight()
    pinBottomNav()
  }

  update()
  window.addEventListener('resize', update)
  window.addEventListener('orientationchange', update)
  window.addEventListener('pageshow', update)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') update()
  })
  window.visualViewport?.addEventListener('resize', update)
  window.visualViewport?.addEventListener('scroll', update)
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
