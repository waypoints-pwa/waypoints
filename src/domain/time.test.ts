import { describe, expect, it } from 'vitest'
import { addDays, daysBetween, eachDay, isDay, isTime, isTimeZone, offsetMinutes, zonedInstant, zoneCity } from './time'

const iso = (ms: number) => new Date(ms).toISOString()

describe('days and times', () => {
  it('accepts only real days and 24-hour times', () => {
    expect(isDay('2027-02-28')).toBe(true)
    expect(isDay('2027-02-29')).toBe(false)
    expect(isDay('2028-02-29')).toBe(true)
    expect(isDay('2027-13-01')).toBe(false)
    expect(isDay('27-01-01')).toBe(false)
    expect(isTime('00:00')).toBe(true)
    expect(isTime('23:59')).toBe(true)
    expect(isTime('24:00')).toBe(false)
    expect(isTime('9:30')).toBe(false)
  })

  it('counts days across month ends and daylight-saving changes', () => {
    expect(addDays('2027-03-27', 2)).toBe('2027-03-29')
    expect(addDays('2027-12-31', 1)).toBe('2028-01-01')
    expect(addDays('2027-03-01', -1)).toBe('2027-02-28')
    expect(daysBetween('2027-03-27', '2027-04-02')).toBe(6)
    expect(daysBetween('2027-04-02', '2027-03-27')).toBe(-6)
    expect(eachDay('2027-12-30', '2028-01-02')).toEqual(['2027-12-30', '2027-12-31', '2028-01-01', '2028-01-02'])
    expect(eachDay('2027-01-02', '2027-01-01')).toEqual([])
    expect(eachDay('2027-01-01', '2099-01-01')).toHaveLength(400)
  })
})

describe('time zones', () => {
  it('knows offsets from UTC, with daylight saving', () => {
    expect(offsetMinutes(Date.UTC(2027, 0, 15), 'Asia/Tokyo')).toBe(540)
    expect(offsetMinutes(Date.UTC(2027, 0, 15), 'Europe/Lisbon')).toBe(0)
    expect(offsetMinutes(Date.UTC(2027, 6, 15), 'Europe/Lisbon')).toBe(60)
    expect(offsetMinutes(Date.UTC(2027, 6, 15), 'America/New_York')).toBe(-240)
    expect(offsetMinutes(Date.UTC(2027, 0, 15), 'Asia/Kolkata')).toBe(330)
  })

  it('places wall-clock times on the timeline', () => {
    expect(iso(zonedInstant('2027-03-14', '10:30', 'Asia/Tokyo'))).toBe('2027-03-14T01:30:00.000Z')
    expect(iso(zonedInstant('2027-07-01', '10:30', 'Europe/Lisbon'))).toBe('2027-07-01T09:30:00.000Z')
    expect(iso(zonedInstant('2027-01-01', undefined, 'America/New_York'))).toBe('2027-01-01T05:00:00.000Z')
    expect(iso(zonedInstant('2027-06-01', '23:45', 'UTC'))).toBe('2027-06-01T23:45:00.000Z')
  })

  it('handles the hours around daylight-saving changes', () => {
    // New York skips 02:00–03:00 on 2027-03-14: a skipped time moves forward with the clocks.
    expect(iso(zonedInstant('2027-03-14', '02:30', 'America/New_York'))).toBe('2027-03-14T07:30:00.000Z')
    expect(iso(zonedInstant('2027-03-14', '12:00', 'America/New_York'))).toBe('2027-03-14T16:00:00.000Z')
    // 01:30 happens twice on 2027-11-07: the first one, still on daylight time.
    expect(iso(zonedInstant('2027-11-07', '01:30', 'America/New_York'))).toBe('2027-11-07T05:30:00.000Z')
    // Lisbon skips 01:00–02:00 on 2027-03-28 and repeats it on 2027-10-31.
    expect(iso(zonedInstant('2027-03-28', '01:30', 'Europe/Lisbon'))).toBe('2027-03-28T01:30:00.000Z')
    expect(iso(zonedInstant('2027-10-31', '01:30', 'Europe/Lisbon'))).toBe('2027-10-31T00:30:00.000Z')
  })

  it('treats a zone it does not know as UTC', () => {
    expect(isTimeZone('Asia/Tokyo')).toBe(true)
    expect(isTimeZone('Mars/Olympus_Mons')).toBe(false)
    expect(iso(zonedInstant('2027-06-01', '12:00', 'Mars/Olympus_Mons'))).toBe('2027-06-01T12:00:00.000Z')
  })

  it('names the city of a zone', () => {
    expect(zoneCity('America/Argentina/Buenos_Aires')).toBe('Buenos Aires')
    expect(zoneCity('UTC')).toBe('UTC')
  })
})
