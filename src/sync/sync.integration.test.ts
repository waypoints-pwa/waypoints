import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { mkdtemp, rm } from 'node:fs/promises'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../../server/src/app.ts'
import { loadConfig, type Config } from '../../server/src/config.ts'
import { Store } from '../../server/src/store.ts'
import { emptyTables } from '../db/types.ts'
import type { Credentials, SyncResponse, TripChanges } from '../domain/serverProtocol.ts'

/*
 * End to end: the app's real sync client (on fake IndexedDB) against the real server. This phone is
 * Max's, the server's admin; Ana's phone talks to the server directly.
 */

let dir: string
let url: string
let config: Config
let store: Store
let close: () => void

beforeAll(async () => {
  await Dexie.delete('waypoints')
  dir = await mkdtemp(join(tmpdir(), 'waypoints-sync-'))
  config = await loadConfig({ DATA_DIR: dir })
  store = new Store(dir)
  await store.load()
  const server = createApp(config, store).listen(0)
  await new Promise((r) => server.once('listening', r))
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  close = () => server.close()
})

afterAll(async () => {
  close()
  await rm(dir, { recursive: true, force: true })
})

async function post<T>(path: string, body: object, token?: string): Promise<T> {
  const res = await fetch(`${url}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`)
  return (await res.json()) as T
}

const tripInput = { name: 'Lisbon & Porto', startDate: '2027-03-10', endDate: '2027-03-13', timeZone: 'Europe/Lisbon', currency: 'EUR' }
const later = (seconds = 1) => new Date(Date.now() + seconds * 1000).toISOString()

describe('sync client ↔ server', async () => {
  const { db, getSetting, SETTINGS } = await import('../db/db')
  const { createTrip, moveTripToServer, saveRecord, updateTrip } = await import('../db/actions')
  const { applyMerge, readTables } = await import('../db/backupIO')
  const { getServerConfig, setServerConfig } = await import('../db/serverState')
  const { runSync, SyncError } = await import('./client')
  const { createInvite, forgetServer, joinWithServerCode, leaveTrip, parseInvite } = await import('./account')

  let ana: Credentials
  let anaCursor = 0
  /** Ana's phone: sends changes to a trip, and gets back what changed. */
  const anaSync = async (trips: TripChanges[] = []) => post<SyncResponse>('/api/sync', { trips }, ana.token)
  const serverTrip = (id: string) => store.data.trips[id]
  const me = async () => (await getServerConfig())!.member

  let phoneOnly: string
  let onServer: string

  it('connects the admin without touching the trips already on the phone', async () => {
    phoneOnly = await createTrip({ ...tripInput, name: 'Japan' }, [{ name: 'Max' }, { name: 'Ana' }])
    await expect(joinWithServerCode(url, 'WRONG-CODE-0000', { name: 'Max' }, 'Pixel')).rejects.toBeInstanceOf(SyncError)
    expect(await getServerConfig()).toBeUndefined()

    await joinWithServerCode(url, config.serverCode, { name: 'Max' }, 'Pixel')
    const cfg = (await getServerConfig())!
    expect(cfg.member).toMatchObject({ name: 'Max', admin: true })
    expect(cfg.lastSyncAt).toBeDefined()
    expect(await db.snapshots.count()).toBe(1)
    // Phone-only trips stay on the phone until someone puts them on the server.
    expect(store.data.trips).toEqual({})
    expect(await db.trips.get(phoneOnly)).toBeDefined()
  })

  it('invites Ana with a link', async () => {
    const invite = await createInvite()
    expect(parseInvite(`Join me on waypoints: ${invite.link}`)).toEqual({ code: invite.code, server: url })
    ana = await post<Credentials>('/api/register', { inviteCode: invite.code, name: 'Ana', deviceLabel: 'iPhone' })
    await runSync()
    expect((await getServerConfig())!.members.map((m) => m.name)).toEqual(['Ana', 'Max'])
  })

  it('creates a trip on the server that reaches Ana by itself', async () => {
    onServer = await createTrip(tripInput, [{ name: 'Max', memberId: (await me()).id }, { name: 'Ana', memberId: ana.member.id }, { name: 'Dee' }], { onServer: true })
    await saveRecord('stays', onServer, { name: 'Casa Azul', kind: 'apartment', checkInDate: '2027-03-10', checkOutDate: '2027-03-12', timeZone: 'Europe/Lisbon' })
    await runSync()

    expect(await db.serverTrips.get(onServer)).toMatchObject({ uploaded: true, cursor: 5 })
    expect(await db.outbox.where('tripId').equals(onServer).count()).toBe(0)
    // Dee isn't on the server: the trip still has changes to send her in a link.
    expect(await db.unsent.where('tripId').equals(onServer).count()).toBe(5)

    const res = await anaSync()
    const forAna = res.trips.find((t) => t.id === onServer)!
    expect(forAna.records.stays).toHaveLength(1)
    expect(res.trips.map((t) => t.id)).toEqual([onServer])
    anaCursor = forAna.cursor
  })

  it("brings Ana's changes in, without counting them as this phone's", async () => {
    const [stay] = (await readTables(onServer)).stays
    const res = await anaSync([{ id: onServer, cursor: anaCursor, records: { stays: [{ ...stay, name: 'Casa Verde', updatedAt: later() }] } }])
    anaCursor = res.trips[0].cursor
    await db.unsent.clear()

    await runSync()
    expect((await db.stays.get(stay.id))!.name).toBe('Casa Verde')
    expect(await db.outbox.where('tripId').equals(onServer).count()).toBe(0)
    expect(await db.unsent.count()).toBe(0)
  })

  it("passes on a link from Dee, who isn't on the server", async () => {
    const fromDee = await readTables(onServer)
    const now = later()
    fromDee.places = [{ id: 'place-from-dee', tripId: onServer, name: 'Livraria Lello', category: 'sight', createdAt: now, updatedAt: now }]
    await applyMerge(fromDee, 'test')
    await runSync()
    expect(serverTrip(onServer).records.places?.['place-from-dee']).toBeDefined()
  })

  it('puts Dee on the trip when she joins the server, as the traveller she already was', async () => {
    const dee = await post<Credentials>('/api/register', { inviteCode: (await createInvite()).code, name: 'Dee', deviceLabel: 'Pixel' })
    const deeSync = (trips: TripChanges[] = []) => post<SyncResponse>('/api/sync', { trips }, dee.token)
    expect((await deeSync()).trips).toEqual([])

    // Joining the server doesn't let her claim a traveller herself, even knowing the trip.
    const deeTraveller = (await db.travellers.where('tripId').equals(onServer).toArray()).find((t) => t.name === 'Dee')!
    const claim = await deeSync([{ id: onServer, cursor: 0, records: { travellers: [{ ...deeTraveller, memberId: dee.member.id, linkedAt: later(), updatedAt: later() }] } }])
    expect(claim.gone).toEqual([onServer])
    expect(serverTrip(onServer).records.travellers?.[deeTraveller.id].rec.memberId).toBeUndefined()

    // Someone on the trip links her: she gets it as that traveller, expenses and all.
    await runSync()
    const travellers = await db.travellers.where('tripId').equals(onServer).sortBy('createdAt')
    await updateTrip(onServer, (await db.trips.get(onServer))!, travellers.map((t) => ({ id: t.id, name: t.name, memberId: t.id === deeTraveller.id ? dee.member.id : t.memberId })))
    await runSync()
    const forDee = (await deeSync()).trips.find((t) => t.id === onServer)!
    expect(forDee.records.travellers!.find((t) => t.memberId === dee.member.id)!.id).toBe(deeTraveller.id)
  })

  it("doesn't let a link change who's on a trip on the server", async () => {
    const anaTraveller = (await db.travellers.where('tripId').equals(onServer).toArray()).find((t) => t.name === 'Ana')!
    // Renamed on a copy from before Ana was linked: she stays on the trip.
    const { memberId: _drop, linkedAt: _dropToo, ...unlinked } = anaTraveller
    await applyMerge({ ...emptyTables(), travellers: [{ ...unlinked, name: 'Ana M.', updatedAt: later(2) }] }, 'test')
    // A crafted link pointing her traveller at someone else changes nothing either.
    await applyMerge({ ...emptyTables(), travellers: [{ ...anaTraveller, name: 'Ana M.', memberId: 'someone-else', linkedAt: later(3), updatedAt: later(3) }] }, 'test')
    await runSync()

    const stored = serverTrip(onServer).records.travellers![anaTraveller.id].rec
    expect(stored).toMatchObject({ name: 'Ana M.', memberId: ana.member.id, linkedAt: anaTraveller.linkedAt })
    expect((await anaSync()).trips.map((t) => t.id)).toContain(onServer)
  })

  it('moves a phone-only trip to the server, with the same id', async () => {
    const [max, anaTraveller] = await db.travellers.where('tripId').equals(phoneOnly).sortBy('createdAt')
    await moveTripToServer(phoneOnly, { [max.id]: (await me()).id, [anaTraveller.id]: ana.member.id })
    await runSync()
    expect(Object.keys(serverTrip(phoneOnly).records.travellers ?? {})).toHaveLength(2)
    expect((await anaSync([{ id: onServer, cursor: anaCursor, records: {} }])).trips.map((t) => t.id)).toContain(phoneOnly)
  })

  it('keeps the trip on the phone when Ana takes Max off it', async () => {
    const res = await anaSync()
    const travellers = res.trips.find((t) => t.id === phoneOnly)!.records.travellers!
    const max = travellers.find((t) => t.memberId !== ana.member.id)!
    await anaSync([{ id: phoneOnly, cursor: 0, records: { travellers: [{ ...max, memberId: undefined, updatedAt: later() }] } }])

    await runSync()
    expect(await db.serverTrips.get(phoneOnly)).toBeUndefined()
    expect(await db.trips.get(phoneOnly)).toBeDefined()
    expect(await getSetting(SETTINGS.serverGone(phoneOnly))).toBeDefined()
  })

  it('sends everything again when the server lost a trip (restored from an older backup)', async () => {
    delete store.data.trips[onServer]
    await runSync()
    expect(serverTrip(onServer).records.places?.['place-from-dee']).toBeDefined()
    expect(await db.serverTrips.get(onServer)).toMatchObject({ uploaded: true })
  })

  it('keeps changes waiting while the server is unreachable', async () => {
    const cfg = (await getServerConfig())!
    await setServerConfig({ ...cfg, url: 'http://127.0.0.1:9' })
    await saveRecord('places', onServer, { name: 'Torre de Belém', category: 'sight' })
    await expect(runSync()).rejects.toBeInstanceOf(SyncError)
    expect((await getServerConfig())!.lastError).toContain("Couldn't reach")
    expect(await db.outbox.where('tripId').equals(onServer).count()).toBe(1)

    await setServerConfig({ ...(await getServerConfig())!, url })
    await runSync()
    expect(await db.outbox.where('tripId').equals(onServer).count()).toBe(0)
    expect((await getServerConfig())!.lastError).toBeUndefined()
  })

  it('leaves a trip: unlinked on the server, removed from the phone', async () => {
    await leaveTrip(onServer)
    expect(await db.trips.get(onServer)).toBeUndefined()
    const memberIds = Object.values(serverTrip(onServer).records.travellers ?? {}).map((t) => t.rec.memberId)
    expect(memberIds).not.toContain((await me()).id)
    expect(memberIds).toContain(ana.member.id)
  })

  it('stops syncing when this phone is disconnected on the server, keeping its trips', async () => {
    const cfg = (await getServerConfig())!
    await post('/api/devices/remove', { deviceId: cfg.deviceId }, cfg.token)
    await expect(runSync()).rejects.toMatchObject({ status: 401 })
    expect(await runSync()).toBe(false) // no more tries after that
    await forgetServer()
    expect(await getServerConfig()).toBeUndefined()
    expect(await db.trips.get(phoneOnly)).toBeDefined()
  })
})
