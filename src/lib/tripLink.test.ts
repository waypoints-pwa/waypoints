import { describe, expect, it } from 'vitest'
import { DataError } from '../domain/records'
import { ANA, BO, expense, place, stay, tables, traveller, trip } from '../test/fixtures'
import { readTripLink, tripLink, tripRouteFrom } from './tripLink'

const lisbon = tables({
  trips: [trip()],
  travellers: [traveller(ANA, 'Ana'), traveller(BO, 'Bo')],
  stays: [stay()],
  places: [place(), place({ id: 'spot0002', name: 'Torre de Belém', city: 'Lisbon' })],
  expenses: [expense({ split: { kind: 'equal', among: [ANA, BO] } })],
})

describe('trip links', () => {
  it('round-trip a trip through a compressed link fragment', async () => {
    const url = await tripLink(lisbon, 'Ana', 'https://example.com/waypoints/')
    expect(url).toMatch(/^https:\/\/example\.com\/waypoints\/#\/t\/[A-Za-z0-9_-]+$/)
    const route = tripRouteFrom(`Our trip! ${url} see you there`)!
    const link = await readTripLink(route.slice('/t/'.length))
    expect(link.tables).toEqual(lisbon)
    expect(link.sentBy).toBe('Ana')
  })

  it('explains a link that was cut off', async () => {
    const url = await tripLink(lisbon, undefined, 'https://example.com/')
    const data = tripRouteFrom(url)!.slice('/t/'.length)
    await expect(readTripLink(data.slice(0, data.length / 2))).rejects.toThrow(DataError)
    await expect(readTripLink('%%%')).rejects.toThrow('incomplete')
  })

  it('only finds trip links in pasted text', () => {
    expect(tripRouteFrom('https://example.com/#/view/abc')).toBeUndefined()
    expect(tripRouteFrom('no link here')).toBeUndefined()
  })
})
