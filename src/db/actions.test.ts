import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { emptyTables } from './types'
import { addTraveller, clearUnsent, createTrip, deleteRecord, patchRecord, removeTripFromPhone, saveRecord, updateTrip } from './actions'
import { applyMerge, previewMerge, readTables } from './backupIO'
import { db, getSetting, SETTINGS } from './db'

const tripInput = { name: 'Lisbon & Porto', startDate: '2027-03-10', endDate: '2027-03-13', timeZone: 'Europe/Lisbon', currency: 'EUR' }
const stayInput = { name: 'Casa Azul', kind: 'apartment' as const, checkInDate: '2027-03-10', checkOutDate: '2027-03-12', timeZone: 'Europe/Lisbon' }
const unsentIds = async (tripId: string) => (await db.unsent.where('tripId').equals(tripId).toArray()).map((u) => u.id).sort()

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('trips', () => {
  it('are created with their travellers, the first one using this phone', async () => {
    const tripId = await createTrip(tripInput, ['Ana', 'Bo'])
    const travellers = await db.travellers.where('tripId').equals(tripId).toArray()
    expect(travellers.map((t) => t.name).sort()).toEqual(['Ana', 'Bo'])
    expect(await getSetting(SETTINGS.me(tripId))).toBe(travellers.find((t) => t.name === 'Ana')!.id)
    expect(await unsentIds(tripId)).toEqual([tripId, ...travellers.map((t) => t.id)].sort())
  })

  it('only save what changed when edited', async () => {
    const tripId = await createTrip(tripInput, ['Ana', 'Bo', 'Cy'])
    const before = await db.trips.get(tripId)
    const [ana, bo] = (await db.travellers.toArray()).sort((a, b) => a.name.localeCompare(b.name))
    await clearUnsent(tripId)

    await updateTrip(tripId, tripInput, [{ id: ana.id, name: 'Ana' }, { id: bo.id, name: 'Bob' }, { name: 'Dee' }])

    expect(await db.trips.get(tripId)).toEqual(before)
    const after = await db.travellers.where('tripId').equals(tripId).toArray()
    expect(after.filter((t) => !t.deletedAt).map((t) => t.name).sort()).toEqual(['Ana', 'Bob', 'Dee'])
    expect(after.find((t) => t.name === 'Cy')?.deletedAt).toBeDefined()
    // Bob renamed, Dee added, Cy removed; Ana and the trip itself untouched.
    expect(await unsentIds(tripId)).toHaveLength(3)
    expect(await unsentIds(tripId)).not.toContain(ana.id)
  })

  it('can be removed from this phone only, keeping a snapshot', async () => {
    const keep = await createTrip({ ...tripInput, name: 'Keep' }, ['Ana'])
    const tripId = await createTrip(tripInput, ['Ana'])
    await saveRecord('stays', tripId, stayInput)
    await removeTripFromPhone((await db.trips.get(tripId))!)

    expect(await db.trips.get(tripId)).toBeUndefined()
    expect(await db.stays.count()).toBe(0)
    expect(await unsentIds(tripId)).toEqual([])
    expect(await getSetting(SETTINGS.me(tripId))).toBeUndefined()
    expect(await db.trips.get(keep)).toBeDefined()
    const [snapshot] = await db.snapshots.toArray()
    expect(snapshot.reason).toContain('Lisbon & Porto')
    expect(JSON.parse(snapshot.data).stays).toHaveLength(1)
  })
})

describe('records', () => {
  it('are saved, edited and deleted for the whole group', async () => {
    const tripId = await createTrip(tripInput, ['Ana'])
    await clearUnsent(tripId)

    const id = await saveRecord('stays', tripId, { ...stayInput, phone: '+351 21 000 0000' })
    expect(await unsentIds(tripId)).toEqual([id])
    const saved = (await db.stays.get(id))!

    // Saving the form unchanged keeps the record as it was, so it can't override newer edits from others.
    await clearUnsent(tripId)
    expect(await saveRecord('stays', tripId, { ...stayInput, phone: '+351 21 000 0000' }, id)).toBe(id)
    expect(await db.stays.get(id)).toEqual(saved)
    expect(await unsentIds(tripId)).toEqual([])

    // A cleared field is removed, fields this version doesn't know are kept.
    await db.stays.put({ ...saved, ...{ breakfast: true } })
    await saveRecord('stays', tripId, { ...stayInput, phone: undefined }, id)
    const edited = (await db.stays.get(id))!
    expect(edited.phone).toBeUndefined()
    expect('phone' in edited).toBe(false)
    expect(edited).toMatchObject({ breakfast: true, createdAt: saved.createdAt })

    await deleteRecord('stays', id)
    expect((await db.stays.get(id))!.deletedAt).toBeDefined()
    expect(await unsentIds(tripId)).toEqual([id])
  })

  it('can be patched, e.g. ticking a place as visited', async () => {
    const tripId = await createTrip(tripInput, ['Ana'])
    const id = await saveRecord('places', tripId, { name: 'Livraria Lello', category: 'sight' })
    await patchRecord('places', id, { visited: true })
    expect((await db.places.get(id))!.visited).toBe(true)
    await patchRecord('places', id, { visited: undefined })
    expect('visited' in (await db.places.get(id))!).toBe(false)
  })

  it('travellers can be added by someone joining', async () => {
    const tripId = await createTrip(tripInput, ['Ana'])
    const id = await addTraveller(tripId, 'Bo')
    expect((await db.travellers.get(id))!.name).toBe('Bo')
    expect(await unsentIds(tripId)).toContain(id)
  })
})

describe('merging a trip from another phone', () => {
  it('adds the trip, then updates it, and is safe to repeat', async () => {
    const tripId = await createTrip(tripInput, ['Ana', 'Bo'])
    const stayId = await saveRecord('stays', tripId, stayInput)
    const sent = await readTables(tripId)

    // The other phone starts empty.
    await db.delete()
    await db.open()
    expect((await previewMerge(sent)).newTrips.map((t) => t.id)).toEqual([tripId])
    expect(await applyMerge(sent, 'test')).toEqual({ added: 4, updated: 0, removed: 0 })
    expect(await readTables(tripId)).toEqual(sent)
    // Merged records came from the group, so they aren't this phone's unsent changes.
    expect(await db.unsent.count()).toBe(0)
    expect(await db.snapshots.count()).toBe(0)

    // A later link renames the stay: overwriting a record here keeps a snapshot first.
    const later = { ...emptyTables(), stays: [{ ...sent.stays[0], name: 'Casa Verde', updatedAt: new Date(Date.now() + 1000).toISOString() }] }
    expect(await applyMerge(later, 'Before merging a link')).toEqual({ added: 0, updated: 1, removed: 0 })
    expect((await db.stays.get(stayId))!.name).toBe('Casa Verde')
    expect(await db.snapshots.count()).toBe(1)

    expect(await applyMerge(later, 'again')).toEqual({ added: 0, updated: 0, removed: 0 })
    expect(await applyMerge(sent, 'older')).toEqual({ added: 0, updated: 0, removed: 0 })
    expect((await db.stays.get(stayId))!.name).toBe('Casa Verde')
  })
})
