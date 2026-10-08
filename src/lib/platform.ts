/** iPhone or iPad (iPadOS reports itself as a Mac, but Macs have no touch screen). */
export const isAppleMobile = () =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)

/**
 * In Safari rather than the Home Screen app. On iOS the two keep separate
 * storage, and links always open in Safari, never in the Home Screen app.
 */
export const inIosBrowser = () => isAppleMobile() && !window.matchMedia('(display-mode: standalone)').matches
