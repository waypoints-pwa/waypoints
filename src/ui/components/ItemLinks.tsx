import { buildICS, googleCalendarLink, type CalendarEvent } from '../../domain/calendar'
import { appleMapsSearch, googleMapsDirections, googleMapsSearch, safeHttpUrl, telLink } from '../../domain/links'
import { downloadBlob, fileSlug } from '../../lib/download'
import { isAppleMobile } from '../../lib/platform'
import { ExternalLink } from './bits'

/** Directions and map searches for a place: no maps API, these open the Maps app or website. */
export function MapLinks({ query, directions = true }: { query?: string; directions?: boolean }) {
  if (!query) return null
  return (
    <div className="actions">
      {directions && <ExternalLink href={googleMapsDirections(query)}>🧭 Directions</ExternalLink>}
      <ExternalLink href={googleMapsSearch(query)}>🗺️ Google Maps</ExternalLink>
      {isAppleMobile() && <ExternalLink href={appleMapsSearch(query)}>🍎 Apple Maps</ExternalLink>}
    </div>
  )
}

export function CalendarLinks({ event, calendarName }: { event: CalendarEvent; calendarName: string }) {
  const download = () => downloadBlob(new Blob([buildICS([event], calendarName)], { type: 'text/calendar' }), `${fileSlug(event.title)}.ics`)
  return (
    <div className="actions">
      <ExternalLink href={googleCalendarLink(event)}>📅 Add to Google Calendar</ExternalLink>
      <button type="button" className="btn btn-small" onClick={download}>
        📅 Calendar file (.ics)
      </button>
    </div>
  )
}

/** A link someone pasted: shown only if it's a web address. */
export function WebLink({ url, children }: { url?: string; children: React.ReactNode }) {
  const href = safeHttpUrl(url)
  return href ? <ExternalLink href={href}>{children} ↗</ExternalLink> : null
}

export function PhoneLink({ phone }: { phone?: string }) {
  const href = telLink(phone)
  return href ? (
    <a className="btn btn-small" href={href}>
      📞 Call
    </a>
  ) : null
}
