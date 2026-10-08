import { describe, expect, it } from 'vitest'
import { activity, stay, transport } from '../test/fixtures'
import { activityEvent, buildICS, googleCalendarLink, stayEvent, transportEvent, tripEvents } from './calendar'

const flight = transport({
  mode: 'flight',
  from: 'Lisbon',
  to: 'Tokyo',
  number: 'TP 123',
  departDate: '2027-03-09',
  departTime: '10:00',
  departTimeZone: 'Europe/Lisbon',
  arriveDate: '2027-03-10',
  arriveTime: '06:00',
  arriveTimeZone: 'Asia/Tokyo',
  confirmation: 'ABC123',
})

describe('events', () => {
  it('puts transport on the real timeline, across time zones', () => {
    const e = transportEvent(flight)
    expect(e.title).toBe('✈️ Lisbon → Tokyo (TP 123)')
    expect(new Date(e.start!).toISOString()).toBe('2027-03-09T10:00:00.000Z')
    expect(new Date(e.end!).toISOString()).toBe('2027-03-09T21:00:00.000Z')
  })

  it('gives events without an end an hour, and untimed ones the whole day', () => {
    const noArrival = transportEvent(transport({ departDate: '2027-03-12', departTime: '09:00' }))
    expect(noArrival.end! - noArrival.start!).toBe(3_600_000)
    expect(activityEvent(activity({ date: '2027-03-11' }))).toMatchObject({ startDay: '2027-03-11', endDay: '2027-03-12' })
  })

  it('shows a stay from check-in day to check-out day', () => {
    const e = stayEvent(stay({ checkInDate: '2027-03-10', checkOutDate: '2027-03-12', checkInTime: '15:00', address: 'Rua Azul 1', city: 'Lisbon' }))
    expect(e).toMatchObject({ startDay: '2027-03-10', endDay: '2027-03-13', location: 'Rua Azul 1, Lisbon' })
    expect(e.description).toContain('Check-in from 15:00')
  })

  it('leaves out deleted records', () => {
    expect(tripEvents([stay({ deletedAt: '2026-10-02T10:00:00.000Z' })], [flight], [])).toHaveLength(1)
  })
})

describe('buildICS', () => {
  const ics = buildICS(
    [
      transportEvent(flight),
      stayEvent(stay({ name: 'Hotel; with, commas', notes: 'Door code 1234\nWi-Fi: casa', link: 'javascript:alert(1)' })),
      activityEvent(activity({ title: 'A'.repeat(100), startTime: '19:00', link: 'https://example.com/tickets' })),
    ],
    'Lisbon & Porto',
    new Date('2026-10-08T12:00:00Z'),
  )
  const unfolded = ics.replace(/\r\n /g, '')

  it('writes a calendar with UTC times and all-day dates', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true)
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
    expect(unfolded).toContain('X-WR-CALNAME:Lisbon & Porto')
    expect(unfolded).toContain('DTSTART:20270309T100000Z\r\nDTEND:20270309T210000Z')
    expect(unfolded).toContain('DTSTART;VALUE=DATE:20270310\r\nDTEND;VALUE=DATE:20270313')
    expect(unfolded).toContain('UID:move0001@waypoints')
    expect(unfolded).toContain('DTSTAMP:20261008T120000Z')
  })

  it('escapes text and only links to web addresses', () => {
    expect(unfolded).toContain('SUMMARY:🏨 Hotel\\; with\\, commas')
    expect(unfolded).toContain('Door code 1234\\nWi-Fi: casa')
    expect(unfolded).not.toContain('javascript')
    expect(unfolded).toContain('URL:https://example.com/tickets')
  })

  it('folds long lines at 75 bytes', () => {
    for (const line of ics.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75)
    expect(unfolded).toContain(`SUMMARY:${'A'.repeat(100)}`)
  })
})

describe('googleCalendarLink', () => {
  it('prefills a timed event in UTC', () => {
    const url = new URL(googleCalendarLink(transportEvent(flight)))
    expect(url.origin).toBe('https://calendar.google.com')
    expect(url.searchParams.get('dates')).toBe('20270309T100000Z/20270309T210000Z')
    expect(url.searchParams.get('text')).toBe('✈️ Lisbon → Tokyo (TP 123)')
    expect(url.searchParams.get('details')).toContain('Booking: ABC123')
  })

  it('prefills an all-day event', () => {
    const url = new URL(googleCalendarLink(stayEvent(stay())))
    expect(url.searchParams.get('dates')).toBe('20270310/20270313')
  })
})
