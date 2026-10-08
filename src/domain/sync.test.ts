import { describe, expect, it } from 'vitest'
import { RECORD_TABLES, type RecordTable, type Tables } from '../db/types'
import { ANA, BO, exchange, expense, place, stay, T0, T1, T2, tables, traveller, trip } from '../test/fixtures'
import { DataError } from './records'
import { buildBackup, decodeLink, encodeLink, parseBackup, planMerge } from './sync'

const NOW = Date.parse('2026-10-08T12:00:00.000Z')
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as unknown

const lisbon = tables({
  trips: [trip()],
  travellers: [traveller(ANA, 'Ana'), traveller(BO, 'Bo')],
  stays: [stay()],
  places: [place()],
  expenses: [expense({ split: { kind: 'equal', among: [ANA, BO] } })],
  exchanges: [exchange()],
})

/** This phone's copies, as planMerge looks them up. */
const local = (t: Tables) =>
  Object.fromEntries(RECORD_TABLES.map((table: RecordTable) => [table, new Map(t[table].map((r) => [r.id, r]))])) as Parameters<typeof planMerge>[0]

describe('backup files', () => {
  it('round-trip every record', () => {
    const text = JSON.stringify(buildBackup(lisbon, new Date(NOW)))
    expect(parseBackup(text, NOW)).toMatchObject({ app: 'waypoints', schemaVersion: 1, ...lisbon })
  })

  it('refuse other files and newer formats', () => {
    expect(() => parseBackup('not json', NOW)).toThrow(DataError)
    expect(() => parseBackup('{"app":"fronds","schemaVersion":1}', NOW)).toThrow("isn't a waypoints file")
    expect(() => parseBackup('{"app":"waypoints","schemaVersion":2}', NOW)).toThrow('newer version')
  })

  it('refuse invalid records', () => {
    const broken = (patch: object) => JSON.stringify({ ...buildBackup(lisbon), stays: [{ ...stay(), ...patch }] })
    expect(() => parseBackup(broken({ checkInDate: '2027-02-30' }), NOW)).toThrow('invalid stay')
    expect(() => parseBackup(broken({ name: 42 }), NOW)).toThrow('invalid stay')
    expect(() => parseBackup(broken({ name: undefined }), NOW)).toThrow('invalid stay')
    expect(() => parseBackup(broken({ id: 'x' }), NOW)).toThrow('invalid stay')
    expect(() => parseBackup(broken({ updatedAt: '2026-10-08T12:00:00Z' }), NOW)).toThrow('invalid stay')
    expect(() => parseBackup(broken({ updatedAt: '2030-01-01T00:00:00.000Z' }), NOW)).toThrow('in the future')
    expect(() => parseBackup(JSON.stringify({ ...buildBackup(lisbon), expenses: [{ ...expense(), split: { kind: 'equal', among: ['x'] } }] }), NOW)).toThrow(
      'invalid expense',
    )
  })

  it('keep fields and kinds from newer versions of the app', () => {
    const newer = { ...stay(), kind: 'treehouse', breakfast: true }
    const parsed = parseBackup(JSON.stringify({ ...buildBackup(lisbon), stays: [newer] }), NOW)
    expect(parsed.stays[0]).toEqual(newer)
  })

  it('accept files with tables missing', () => {
    expect(parseBackup(JSON.stringify({ app: 'waypoints', schemaVersion: 1, trips: [trip()] }), NOW).stays).toEqual([])
  })
})

describe('trip links', () => {
  it('carry one trip without repeating its id on every record', () => {
    const other = tables({ trips: [trip()], stays: [stay(), stay({ id: 'stay0009', tripId: 'trip0009' })] })
    const payload = encodeLink(other, 'Ana', new Date(NOW)) as { stays: object[] }
    expect(payload.stays).toEqual([expect.not.objectContaining({ tripId: expect.anything() })])
    expect(payload.stays).toHaveLength(1)
  })

  it('decode back to the same records', () => {
    const link = decodeLink(json(encodeLink(lisbon, '  Ana  ', new Date(NOW))), NOW)
    expect(link.sentBy).toBe('Ana')
    expect(link.sentAt).toBe('2026-10-08T12:00:00.000Z')
    expect(link.tables).toEqual(lisbon)
  })

  it('refuse links from a newer version, and broken ones', () => {
    expect(() => decodeLink({ v: 2, trip: {}, sentAt: '' }, NOW)).toThrow('newer version')
    expect(() => decodeLink({ hello: 1 }, NOW)).toThrow(DataError)
    expect(() => decodeLink({ v: 1, sentAt: 'x', trip: { ...trip(), currency: 'euro' } }, NOW)).toThrow('invalid trip')
    expect(() => decodeLink({ v: 1, sentAt: 'x', trip: trip(), stays: 'nope' }, NOW)).toThrow(DataError)
  })
})

describe('planMerge', () => {
  it('adds new records and keeps the newest copy of each', () => {
    const mine = tables({ trips: [trip()], places: [place({ updatedAt: T1, notes: 'mine' })], stays: [stay()] })
    const theirs = tables({
      trips: [trip()],
      places: [place({ updatedAt: T0, notes: 'older' })],
      stays: [stay({ updatedAt: T1, name: 'Renamed' })],
      expenses: [expense()],
    })
    const plan = planMerge(local(mine), theirs)
    expect(plan.counts).toEqual({ added: 1, updated: 1, removed: 0 })
    expect(plan.changes.stays).toEqual([theirs.stays[0]])
    expect(plan.changes.places).toEqual([])
    expect(plan.changes.trips).toEqual([])
    expect(plan.newTrips).toEqual([])
  })

  it('applies deletions that are newer than the edit here', () => {
    const plan = planMerge(local(tables({ stays: [stay({ updatedAt: T1 })] })), tables({ stays: [stay({ updatedAt: T2, deletedAt: T2 })] }))
    expect(plan.counts).toEqual({ added: 0, updated: 0, removed: 1 })
  })

  it('changes nothing when merging the same trip twice', () => {
    expect(planMerge(local(lisbon), lisbon).counts).toEqual({ added: 0, updated: 0, removed: 0 })
  })

  it('reports trips that are new to this phone', () => {
    expect(planMerge(local(tables()), lisbon).newTrips.map((t) => t.id)).toEqual(['trip0001'])
  })

  it('never moves a record to another trip', () => {
    const plan = planMerge(local(tables({ stays: [stay()] })), tables({ stays: [stay({ tripId: 'trip0009', updatedAt: T2 })] }))
    expect(plan.changes.stays).toEqual([])
  })
})
