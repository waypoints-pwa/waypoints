import type { Activity, Day, Stay, Transport } from '../db/types.ts'
import { safeHttpUrl } from './links.ts'
import { addDays, zonedInstant } from './time.ts'

/*
 * Calendar export without any Google/Apple API: an .ics file that every calendar app imports, and a
 * prefilled "Add to Google Calendar" link per item. Timed events are written in UTC, so they land at
 * the right moment whatever time zone the calendar shows. Each event's UID is the record's id:
 * importing a newer file updates the events instead of duplicating them (in apps that support it).
 */

export interface CalendarEvent {
  uid: string
  updatedAt: string
  title: string
  /** Timed event: UTC milliseconds. */
  start?: number
  end?: number
  /** All-day event: first day, and the day after the last one. */
  startDay?: Day
  endDay?: Day
  location?: string
  description?: string
  url?: string
}

const HOUR = 3_600_000
const lines = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join('\n') || undefined

export const MODE_EMOJI: Record<string, string> = { flight: '✈️', train: '🚆', bus: '🚌', car: '🚗', ferry: '⛴️' }

export function transportEvent(t: Transport): CalendarEvent {
  const title = `${MODE_EMOJI[t.mode] ?? '🧭'} ${t.from} → ${t.to}${t.number ? ` (${t.number})` : ''}`
  const description = lines(
    [t.carrier, t.number].filter(Boolean).join(' '),
    t.seat && `Seat ${t.seat}`,
    t.confirmation && `Booking: ${t.confirmation}`,
    t.notes,
  )
  const base = { uid: t.id, updatedAt: t.updatedAt, title, location: t.from, description, url: safeHttpUrl(t.link) }
  if (!t.departTime) return { ...base, startDay: t.departDate, endDay: addDays(t.arriveDate ?? t.departDate, 1) }
  const start = zonedInstant(t.departDate, t.departTime, t.departTimeZone)
  const arrival = t.arriveTime ? zonedInstant(t.arriveDate ?? t.departDate, t.arriveTime, t.arriveTimeZone ?? t.departTimeZone) : undefined
  return { ...base, start, end: arrival && arrival > start ? arrival : start + HOUR }
}

/** A stay is an all-day event from check-in to check-out day, both included. */
export function stayEvent(s: Stay): CalendarEvent {
  return {
    uid: s.id,
    updatedAt: s.updatedAt,
    title: `🏨 ${s.name}`,
    startDay: s.checkInDate,
    endDay: addDays(s.checkOutDate, 1),
    location: [s.address, s.city].filter(Boolean).join(', ') || undefined,
    description: lines(
      s.checkInTime && `Check-in from ${s.checkInTime}`,
      s.checkOutTime && `Check-out by ${s.checkOutTime}`,
      s.confirmation && `Booking: ${s.confirmation}`,
      s.phone && `Phone: ${s.phone}`,
      s.notes,
    ),
    url: safeHttpUrl(s.link),
  }
}

export function activityEvent(a: Activity): CalendarEvent {
  const base = {
    uid: a.id,
    updatedAt: a.updatedAt,
    title: a.title,
    location: [a.address, a.city].filter(Boolean).join(', ') || undefined,
    description: lines(a.confirmation && `Booking: ${a.confirmation}`, a.notes),
    url: safeHttpUrl(a.link),
  }
  if (!a.startTime) return { ...base, startDay: a.date, endDay: addDays(a.date, 1) }
  const start = zonedInstant(a.date, a.startTime, a.timeZone)
  const end = a.endTime ? zonedInstant(a.date, a.endTime, a.timeZone) : undefined
  return { ...base, start, end: end && end > start ? end : start + HOUR }
}

export function tripEvents(stays: Stay[], transports: Transport[], activities: Activity[]): CalendarEvent[] {
  const live = <T extends { deletedAt?: string }>(records: T[]) => records.filter((r) => !r.deletedAt)
  return [...live(transports).map(transportEvent), ...live(stays).map(stayEvent), ...live(activities).map(activityEvent)]
}

const utcStamp = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
const dateStamp = (day: Day) => day.replace(/-/g, '')

const escapeText = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

/** RFC 5545 line folding: at most 75 octets per line; continuation lines start with a space. */
function fold(line: string): string {
  const encoder = new TextEncoder()
  if (encoder.encode(line).length <= 75) return line
  const out: string[] = []
  let current = ''
  let size = 0
  for (const ch of line) {
    const n = encoder.encode(ch).length
    if (size + n > (out.length ? 74 : 75)) {
      out.push(current)
      current = ''
      size = 0
    }
    current += ch
    size += n
  }
  out.push(current)
  return out.join('\r\n ')
}

// Seconds since 2020: grows with every edit and fits SEQUENCE's integer.
const sequence = (updatedAt: string) => Math.max(0, Math.floor((Date.parse(updatedAt) - Date.UTC(2020, 0, 1)) / 1000))

export function buildICS(events: CalendarEvent[], calendarName: string, now = new Date()): string {
  const out = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//waypoints//trip//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(calendarName)}`,
  ]
  for (const e of events) {
    out.push('BEGIN:VEVENT', `UID:${e.uid}@waypoints`, `DTSTAMP:${utcStamp(now.getTime())}`, `SEQUENCE:${sequence(e.updatedAt)}`)
    if (e.start !== undefined) out.push(`DTSTART:${utcStamp(e.start)}`, `DTEND:${utcStamp(e.end ?? e.start + HOUR)}`)
    else out.push(`DTSTART;VALUE=DATE:${dateStamp(e.startDay!)}`, `DTEND;VALUE=DATE:${dateStamp(e.endDay!)}`)
    out.push(`SUMMARY:${escapeText(e.title)}`)
    if (e.location) out.push(`LOCATION:${escapeText(e.location)}`)
    if (e.description) out.push(`DESCRIPTION:${escapeText(e.description)}`)
    if (e.url) out.push(`URL:${e.url}`)
    out.push('END:VEVENT')
  }
  out.push('END:VCALENDAR')
  return out.map(fold).join('\r\n') + '\r\n'
}

export function googleCalendarLink(e: CalendarEvent): string {
  const dates =
    e.start !== undefined ? `${utcStamp(e.start)}/${utcStamp(e.end ?? e.start + HOUR)}` : `${dateStamp(e.startDay!)}/${dateStamp(e.endDay!)}`
  const params = new URLSearchParams({ action: 'TEMPLATE', text: e.title, dates })
  const details = [e.description, e.url].filter(Boolean).join('\n')
  if (details) params.set('details', details)
  if (e.location) params.set('location', e.location)
  return `https://calendar.google.com/calendar/render?${params}`
}
