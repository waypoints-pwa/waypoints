import { describe, expect, it } from 'vitest'
import type { Tables } from '../../src/db/types.ts'
import type { SyncRequest } from '../../src/domain/serverProtocol.ts'
import { ANA, BO, CY, place, stay, T0, T1, T2, traveller, trip } from '../../src/test/fixtures.ts'
import { emptyData, type Member, type StoreData } from './store.ts'
import { applySync, BadRequest, parseSyncRequest } from './sync.ts'

const NOW = new Date('2026-10-08T12:00:00.000Z')
const TRIP = 'trip0001'
const ANA_M = 'member-ana'
const BO_M = 'member-bo'
const CY_M = 'member-cy'

const member = (id: string, name: string): Member => ({ id, name, admin: false, createdAt: T0, devices: {} })

function server(): StoreData {
  return { ...emptyData(), members: { [ANA_M]: member(ANA_M, 'Ana'), [BO_M]: member(BO_M, 'Bo'), [CY_M]: member(CY_M, 'Cy') } }
}

/** Ana and Bo are on the server; Cy (a member too) isn't on this trip; Dee only uses links. */
const lisbon = (): Partial<Tables> => ({
  trips: [trip()],
  travellers: [traveller(ANA, 'Ana', { memberId: ANA_M }), traveller(BO, 'Bo', { memberId: BO_M }), traveller(CY, 'Dee')],
  stays: [stay()],
})

const send = (records: Partial<Tables>, cursor = 0, id = TRIP): SyncRequest => ({ trips: [{ id, cursor, records }] })
const sync = (data: StoreData, who: string, req: SyncRequest = { trips: [] }) => applySync(data, data.members[who], req, NOW)

describe('a trip on the server', () => {
  it('is created by one of its travellers, and reaches the others linked to it', () => {
    const data = server()
    const { response, changed } = sync(data, ANA_M, send(lisbon()))
    expect(changed).toBe(true)
    // Everything sent was accepted, so nothing needs to come back.
    expect(response.trips).toEqual([{ id: TRIP, cursor: 5, records: {} }])
    expect(response.members.map((m) => m.name)).toEqual(['Ana', 'Bo', 'Cy'])

    const bo = sync(data, BO_M).response
    expect(bo.trips).toHaveLength(1)
    expect(bo.trips[0]).toMatchObject({ id: TRIP, cursor: 5 })
    expect(bo.trips[0].records).toEqual(lisbon())

    expect(sync(data, CY_M).response.trips).toEqual([])
  })

  it("isn't created when the sender isn't one of its travellers", () => {
    const data = server()
    const { response, changed } = sync(data, CY_M, send(lisbon()))
    expect(response).toMatchObject({ trips: [], gone: [TRIP] })
    expect(changed).toBe(false)
    expect(data.trips).toEqual({})
  })

  it('stays closed to members who are not on it, even if they know its id', () => {
    const data = server()
    sync(data, ANA_M, send(lisbon()))
    const intruder = { ...lisbon(), travellers: [traveller('cy-ghost', 'Cy', { memberId: CY_M, updatedAt: T1 })] }
    const { response, changed } = sync(data, CY_M, send(intruder, 5))
    expect(response).toMatchObject({ trips: [], gone: [TRIP] })
    expect(changed).toBe(false)
    expect(data.trips[TRIP].records.travellers?.['cy-ghost']).toBeUndefined()
  })

  it('merges record by record: newer wins, and an older copy gets the newer one back', () => {
    const data = server()
    sync(data, ANA_M, send(lisbon()))

    // Bo renames the stay; Ana, whose clock is behind, sends an older edit of it plus a new place.
    sync(data, BO_M, send({ stays: [stay({ name: 'Casa Verde', updatedAt: T2 })] }, 5))
    const { response } = sync(data, ANA_M, send({ stays: [stay({ name: 'Casa Rosa', updatedAt: T1 })], places: [place({ tripId: TRIP })] }, 5))

    expect(data.trips[TRIP].records.stays?.stay0001.rec.name).toBe('Casa Verde')
    expect(response.trips[0].cursor).toBe(7)
    // Ana gets Bo's rename (her copy lost), not the place she just sent.
    expect(response.trips[0].records).toEqual({ stays: [stay({ name: 'Casa Verde', updatedAt: T2 })] })
  })

  it('is left by unlinking yourself, and closes to someone unlinked by another traveller', () => {
    const data = server()
    sync(data, ANA_M, send(lisbon()))

    // Ana takes Bo off the server trip; his expenses would keep him as a traveller, just not linked.
    sync(data, ANA_M, send({ travellers: [traveller(BO, 'Bo', { updatedAt: T1 })] }, 5))
    expect(sync(data, BO_M, send({}, 5)).response).toMatchObject({ trips: [], gone: [TRIP] })

    // Ana leaves: her last change is kept, then the trip is gone for her.
    const { response, changed } = sync(data, ANA_M, send({ travellers: [traveller(ANA, 'Ana', { updatedAt: T2 })] }, 6))
    expect(changed).toBe(true)
    expect(response.gone).toEqual([TRIP])
    expect(data.trips[TRIP].records.travellers?.[ANA].rec.memberId).toBeUndefined()
  })

  it('closes to members removed from the server', () => {
    const data = server()
    sync(data, ANA_M, send(lisbon()))
    delete data.members[BO_M]
    expect(sync(data, ANA_M).response.members.map((m) => m.name)).toEqual(['Ana', 'Cy'])
    data.members[BO_M] = member(BO_M, 'Bo')
    expect(sync(data, BO_M).response.trips).toHaveLength(1)
  })

  it('asks for everything again when the server is behind the phone', () => {
    const data = server()
    sync(data, ANA_M, send(lisbon()))

    // Restored from an older backup: the phone has pulled further than the server ever got.
    const behind = sync(data, ANA_M, send({}, 9)).response
    expect(behind.resend).toEqual([TRIP])
    expect(behind.trips[0]).toMatchObject({ id: TRIP, cursor: 5, records: lisbon() })

    // The trip itself is missing: nothing partial is stored until the phone sends it all.
    const empty = server()
    const missing = sync(empty, ANA_M, send({ stays: [stay({ updatedAt: T1 })] }, 9))
    expect(missing.response).toMatchObject({ trips: [], gone: [], resend: [TRIP] })
    expect(missing.changed).toBe(false)
    expect(empty.trips).toEqual({})
  })

  it('refuses invalid records and keeps the rest', () => {
    const data = server()
    const { response } = sync(
      data,
      ANA_M,
      send({
        ...lisbon(),
        stays: [stay({ checkInDate: '2027-02-30' })],
        places: [place({ tripId: 'another-trip' }), place({ id: 'spot0002', tripId: TRIP })],
        ...({ reviews: [{ id: 'review01' }] } as object),
      }),
    )
    expect(response.rejected.map((r) => `${r.table}/${r.id}`)).toEqual(['stays/stay0001', 'places/spot0001', 'reviews/review01'])
    expect(response.rejected[1].reason).toContain('another trip')
    expect(Object.keys(data.trips[TRIP].records.places ?? {})).toEqual(['spot0002'])
    expect(data.trips[TRIP].records.stays).toEqual({})
  })
})

describe('sync requests', () => {
  it('must be a list of trips with records', () => {
    expect(() => parseSyncRequest(null)).toThrow(BadRequest)
    expect(() => parseSyncRequest({ trips: [{ id: TRIP, cursor: -1, records: {} }] })).toThrow(BadRequest)
    expect(() => parseSyncRequest({ trips: [{ id: 'x', cursor: 0, records: {} }] })).toThrow(BadRequest)
    expect(() => parseSyncRequest({ trips: [{ id: TRIP, cursor: 0, records: { stays: {} } }] })).toThrow(BadRequest)
    const twice = { id: TRIP, cursor: 0, records: {} }
    expect(() => parseSyncRequest({ trips: [twice, twice] })).toThrow('twice')
    expect(parseSyncRequest({ trips: [twice] })).toEqual({ trips: [twice] })
  })
})

