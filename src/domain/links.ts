/*
 * Links out of the app: maps, phone numbers and the booking links people paste. No maps API: these
 * are the public "search" and "directions" URLs, which open the Maps app or website.
 *
 * Links in a trip can come from anyone with a trip link, so only http(s) addresses ever become a
 * clickable href (never `javascript:` or other schemes).
 */

export function safeHttpUrl(text: string | undefined): string | undefined {
  const value = text?.trim()
  if (!value) return undefined
  // Pasted without a scheme ("booking.com/…"): assume https.
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(value) ? value : /^[\w-]+(\.[\w-]+)+([/?#]|$)/.test(value) ? `https://${value}` : undefined
  if (!candidate) return undefined
  try {
    const url = new URL(candidate)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : undefined
  } catch {
    return undefined
  }
}

/** What to search a map for: the place and where it is, e.g. "Fushimi Inari, Kyoto". */
export const mapQuery = (...parts: (string | undefined)[]) =>
  parts.map((p) => p?.trim()).filter(Boolean).join(', ') || undefined

export const googleMapsSearch = (query: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`

export const googleMapsDirections = (destination: string) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`

export const appleMapsSearch = (query: string) => `https://maps.apple.com/?q=${encodeURIComponent(query)}`

/** A dialable `tel:` link, or undefined when there aren't enough digits for a phone number. */
export function telLink(phone: string | undefined): string | undefined {
  const digits = phone?.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '')
  return digits && digits.replace('+', '').length >= 3 ? `tel:${digits}` : undefined
}
