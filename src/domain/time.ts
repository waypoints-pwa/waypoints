import type { Day, Time } from '../db/types.ts'

/*
 * Dates and times without a date library. A day is "YYYY-MM-DD" and a time "HH:MM", both as the
 * wall clock shows them where things happen. Timed records also keep that place's IANA time zone,
 * which puts them on the real timeline (ordering, durations, calendar export) using the time zone
 * data built into every browser.
 */

const DAY_MS = 86_400_000
const pad2 = (n: number) => String(n).padStart(2, '0')

export function isDay(value: unknown): value is Day {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
}

export const isTime = (value: unknown): value is Time => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)

/** This device's calendar day at `date`. */
export const toDay = (date: Date): Day => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`

// Days as UTC midnights, so arithmetic on them never trips over daylight saving.
const dayMs = (day: Day) => {
  const [y, m, d] = day.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

export const addDays = (day: Day, days: number): Day => new Date(dayMs(day) + days * DAY_MS).toISOString().slice(0, 10)
export const daysBetween = (from: Day, to: Day) => Math.round((dayMs(to) - dayMs(from)) / DAY_MS)

/** Every day from `from` to `to`, both included (at most `limit`, so a mistyped year can't freeze the page). */
export function eachDay(from: Day, to: Day, limit = 400): Day[] {
  const days: Day[] = []
  for (let day = from; day <= to && days.length < limit; day = addDays(day, 1)) days.push(day)
  return days
}

/** Local midnight of `day` on this device, for formatting it. */
export function dayToDate(day: Day): Date {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const deviceTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

const clocks = new Map<string, Intl.DateTimeFormat>()

/** Formats instants as the wall clock in `timeZone` shows them. An unknown zone falls back to UTC. */
function wallClock(timeZone: string): Intl.DateTimeFormat {
  let clock = clocks.get(timeZone)
  if (!clock) {
    const options = { hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' } as const
    try {
      clock = new Intl.DateTimeFormat('en-US', { ...options, timeZone })
    } catch {
      // A zone newer than this browser's data, from someone else's phone.
      clock = new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' })
    }
    clocks.set(timeZone, clock)
  }
  return clock
}

export function isTimeZone(value: unknown): value is string {
  if (typeof value !== 'string' || !value || value.length > 64) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value })
    return true
  } catch {
    return false
  }
}

/** Minutes that `timeZone` is ahead of UTC at `instant` (negative west of Greenwich). */
export function offsetMinutes(instant: number, timeZone: string): number {
  const p: Record<string, number> = {}
  for (const part of wallClock(timeZone).formatToParts(instant)) p[part.type] = Number(part.value)
  const wall = Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second)
  return Math.round((wall - Math.floor(instant / 1000) * 1000) / 60_000)
}

/**
 * The instant when the wall clock in `timeZone` shows `day` at `time` (midnight without a time).
 * A time that happens twice when the clocks go back is the first one; a time skipped when they go
 * forward moves forward with them.
 */
export function zonedInstant(day: Day, time: Time | undefined, timeZone: string): number {
  const [y, m, d] = day.split('-').map(Number)
  const [hh, mm] = (time ?? '00:00').split(':').map(Number)
  const wall = Date.UTC(y, m - 1, d, hh, mm)
  // The offsets in force a day either side cover any daylight-saving change near this time.
  const offsets = [offsetMinutes(wall - DAY_MS, timeZone), offsetMinutes(wall + DAY_MS, timeZone)]
  const matches = offsets.map((o) => wall - o * 60_000).filter((t) => wall - offsetMinutes(t, timeZone) * 60_000 === t)
  return matches.length ? Math.min(...matches) : wall - offsets[0] * 60_000
}

/** Short name of a zone at an instant, like "GMT+9" or "CET", depending on the device's language. */
export function timeZoneName(timeZone: string, instant: number): string {
  try {
    const parts = new Intl.DateTimeFormat(undefined, { timeZone, timeZoneName: 'short' }).formatToParts(instant)
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? timeZone
  } catch {
    return timeZone
  }
}

/** "Asia/Tokyo" → "Tokyo". */
export const zoneCity = (timeZone: string) => timeZone.split('/').at(-1)!.replace(/_/g, ' ')

/** Every zone this browser knows, sorted. */
export function allTimeZones(): string[] {
  try {
    return [...Intl.supportedValuesOf('timeZone')].sort()
  } catch {
    return ['UTC']
  }
}
