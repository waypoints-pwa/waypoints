import { expect, test } from 'vitest'
import { parseBackup } from '../../src/domain/sync.ts'
import { demoBackup } from './demo-trip.ts'

test('the demo trip is a valid backup with everything the guide shows', async () => {
  const backup = parseBackup(JSON.stringify(await demoBackup()))
  expect(backup.trips).toHaveLength(1)
  expect(backup.travellers).toHaveLength(3)
  expect(backup.stays.length).toBeGreaterThanOrEqual(2)
  expect(backup.transports.length).toBeGreaterThanOrEqual(2)
  expect(backup.activities.length).toBeGreaterThanOrEqual(3)
  expect(backup.places.length).toBeGreaterThanOrEqual(4)
  expect(backup.expenses.length).toBeGreaterThanOrEqual(6)
  expect(backup.exchanges).toHaveLength(2)
  expect(backup.reviews.length).toBeGreaterThanOrEqual(6)
})

test('the Portuguese demo trip has the same shape, with its own texts', async () => {
  const en = await demoBackup()
  const pt = parseBackup(JSON.stringify(await demoBackup('pt')))
  for (const table of ['trips', 'travellers', 'stays', 'transports', 'places', 'activities', 'expenses', 'exchanges', 'reviews'] as const) {
    expect(pt[table], table).toHaveLength(en[table].length)
  }
  expect(pt.trips[0].name).toBe('Japão na primavera')
  expect(pt.expenses.some((e) => e.title === 'Shinkansen para Quioto' && e.amount === 41400)).toBe(true)

  const kept = new Set(['Hotel Sakura', 'teamLab Planets', 'Ichiran Ramen Shibuya'])
  const texts = (b: typeof en) => [
    ...b.expenses.map((e) => e.title),
    ...b.places.map((p) => p.name),
    ...b.activities.map((a) => a.title),
    ...b.reviews.map((r) => r.note),
  ].filter((x): x is string => x !== undefined && !kept.has(x))
  const english = new Set(texts(en))
  for (const text of texts(pt)) expect(english.has(text), text).toBe(false)
})
