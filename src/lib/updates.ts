import { registerSW } from 'virtual:pwa-register'

/*
 * App updates. A new version downloads in the background and waits: it only takes over when the page
 * reloads, so nothing half-typed is lost. Found before the user has touched anything (a fresh launch),
 * it's applied straight away; otherwise UpdateBanner asks (again after each return to the app, if put
 * off). The service worker side is the SKIP_WAITING message handler that vite-plugin-pwa generates.
 */

const CHECK_EVERY_MS = 60 * 60 * 1000

let ready = false
let interacted = false
let reloading = false
const listeners = new Set<() => void>()

export const isUpdateReady = () => ready

export function subscribeUpdate(listener: () => void) {
  listeners.add(listener)
  return () => void listeners.delete(listener)
}

function reload() {
  if (reloading) return
  reloading = true
  location.reload()
}

/** Lets the waiting version take over, then reloads into it. */
export async function applyUpdate() {
  const waiting = (await navigator.serviceWorker.getRegistration())?.waiting
  if (!waiting) return reload() // already took over, e.g. from another tab
  // The plugin only reloads pages that were already controlled when they loaded, which misses an
  // update that arrives during someone's first visit, so reload here too.
  navigator.serviceWorker.addEventListener('controllerchange', reload)
  waiting.postMessage({ type: 'SKIP_WAITING' })
}

export function startUpdates() {
  const markInteracted = () => {
    interacted = true
  }
  addEventListener('pointerdown', markInteracted, { capture: true, passive: true })
  addEventListener('keydown', markInteracted, { capture: true, passive: true })

  registerSW({
    immediate: true,
    onNeedRefresh() {
      if (!interacted) return void applyUpdate()
      ready = true
      listeners.forEach((l) => l())
    },
    // Other open tabs follow along once one of them applies the update.
    onNeedReload: reload,
    onRegisteredSW(_url, registration) {
      if (!registration) return
      // Hash routing means no page loads after the first, so an app left open (or resumed from the
      // background on a phone) would otherwise never look for a new version.
      let lastCheck = Date.now()
      const check = () => {
        if (document.visibilityState !== 'visible' || Date.now() - lastCheck < CHECK_EVERY_MS) return
        lastCheck = Date.now()
        registration.update().catch(() => undefined) // offline or server unreachable: try again later
      }
      document.addEventListener('visibilitychange', check)
      setInterval(check, CHECK_EVERY_MS)
    },
  })
}
