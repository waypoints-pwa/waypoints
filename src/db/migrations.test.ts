import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { expect, it } from 'vitest'
import { exchange, expense, stay, traveller, trip } from '../test/fixtures'

/*
 * Guards existing users' data: open a database exactly as v0.1 of the app created it, then open it
 * with the current schema and check nothing was lost. When adding db.version(n), keep this test and
 * add the new tables' expectations — never delete the v1 seeding below.
 */

it('opening a v0.1 database with the current schema keeps every record', async () => {
  await Dexie.delete('waypoints')
  const v1 = new Dexie('waypoints')
  v1.version(1).stores({
    trips: 'id',
    travellers: 'id, tripId',
    stays: 'id, tripId',
    transports: 'id, tripId',
    activities: 'id, tripId',
    places: 'id, tripId',
    expenses: 'id, tripId',
    exchanges: 'id, tripId',
    unsent: '[table+id], tripId',
    settings: 'key',
    snapshots: '++id, createdAt',
  })
  await v1.open()
  await v1.table('trips').add(trip())
  await v1.table('travellers').add(traveller('ana00001', 'Ana'))
  await v1.table('stays').add(stay({ deletedAt: '2026-10-02T10:00:00.000Z' }))
  await v1.table('expenses').add(expense())
  await v1.table('exchanges').add(exchange())
  await v1.table('unsent').add({ table: 'stays', id: 'stay0001', tripId: 'trip0001' })
  await v1.table('settings').add({ key: 'me:trip0001', value: 'ana00001' })
  v1.close()

  const { db } = await import('./db')
  await db.open()

  expect(db.verno).toBeGreaterThanOrEqual(2)
  // v2 (0.3.0): the sync server's tables start empty; no trip is on a server until someone puts it there.
  expect(await db.outbox.count()).toBe(0)
  expect(await db.serverTrips.count()).toBe(0)
  expect(await db.trips.toArray()).toEqual([trip()])
  expect(await db.travellers.toArray()).toEqual([traveller('ana00001', 'Ana')])
  expect(await db.stays.toArray()).toEqual([stay({ deletedAt: '2026-10-02T10:00:00.000Z' })])
  expect(await db.expenses.toArray()).toEqual([expense()])
  expect(await db.exchanges.toArray()).toEqual([exchange()])
  expect(await db.unsent.count()).toBe(1)
  expect(await db.settings.get('me:trip0001')).toEqual({ key: 'me:trip0001', value: 'ana00001' })
  db.close()
})

it('opening a 0.3.0 database pulls every trip on the server again, once', async () => {
  await Dexie.delete('waypoints')
  const v2 = new Dexie('waypoints')
  v2.version(1).stores({
    trips: 'id',
    travellers: 'id, tripId',
    stays: 'id, tripId',
    transports: 'id, tripId',
    activities: 'id, tripId',
    places: 'id, tripId',
    expenses: 'id, tripId',
    exchanges: 'id, tripId',
    unsent: '[table+id], tripId',
    settings: 'key',
    snapshots: '++id, createdAt',
  })
  v2.version(2).stores({ outbox: '[table+id], tripId', serverTrips: 'tripId' })
  await v2.open()
  await v2.table('trips').add(trip())
  await v2.table('serverTrips').add({ tripId: 'trip0001', cursor: 7, uploaded: true })
  await v2.table('outbox').add({ table: 'trips', id: 'trip0001', tripId: 'trip0001' })
  v2.close()

  const { db } = await import('./db')
  await db.open()

  // v3 (0.4.0): photos and documents start empty. 0.3.0 skipped the ones the server sent, so the
  // trip is pulled again from the start; what's waiting to go up stays waiting.
  expect(await db.attachments.count()).toBe(0)
  expect(await db.files.count()).toBe(0)
  expect(await db.serverTrips.toArray()).toEqual([{ tripId: 'trip0001', cursor: 0, uploaded: true }])
  expect(await db.outbox.count()).toBe(1)
  expect(await db.trips.toArray()).toEqual([trip()])
  db.close()
})
