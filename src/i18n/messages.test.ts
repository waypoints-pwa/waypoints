import { describe, expect, it } from 'vitest'
import { en } from './en'
import { pt } from './pt'

function walk(a: unknown, b: unknown, path: string) {
  expect(typeof b, path).toBe(typeof a)
  if (typeof a === 'string') {
    expect(a.length, `${path} (en) is empty`).toBeGreaterThan(0)
    expect((b as string).length, `${path} (pt) is empty`).toBeGreaterThan(0)
  } else if (typeof a === 'object' && a !== null) {
    const bo = b as Record<string, unknown>
    expect(Object.keys(bo).sort(), path).toEqual(Object.keys(a).sort())
    for (const key of Object.keys(a)) walk((a as Record<string, unknown>)[key], bo[key], `${path}.${key}`)
  }
}

describe('messages', () => {
  it('en and pt have the same keys and leaf types, with no empty text', () => {
    walk(en, pt, 'm')
  })
})
