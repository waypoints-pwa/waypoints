import { describe, expect, it } from 'vitest'
import type { PackingItem } from '../db/types.ts'
import { newFromTemplate, TEMPLATE_IDS } from '../domain/packing.ts'
import { en } from './en/index.ts'
import { pt } from './pt/index.ts'

const languages = { en, pt }

describe('packing templates', () => {
  for (const [name, dict] of Object.entries(languages)) {
    describe(name, () => {
      const templates = dict.packing.templates

      it('has exactly the template ids', () => {
        expect(Object.keys(templates).sort()).toEqual([...TEMPLATE_IDS].sort())
      })

      it('gives every template a label and at least 8 items with no repeats', () => {
        for (const id of TEMPLATE_IDS) {
          expect(templates[id].label).toBeTruthy()
          expect(templates[id].items.length).toBeGreaterThanOrEqual(8)
          const keys = templates[id].items.map((x) => x.trim().toLowerCase())
          expect(new Set(keys).size).toBe(keys.length)
        }
      })

      it('adds nothing the second time', () => {
        for (const id of TEMPLATE_IDS) {
          const once = newFromTemplate([], templates[id]).map(
            (text, i): PackingItem => ({
              id: String(i),
              tripId: 'trip0001',
              text,
              createdAt: '2026-10-01T10:00:00.000Z',
              updatedAt: '2026-10-01T10:00:00.000Z',
            }),
          )
          expect(newFromTemplate(once, templates[id])).toEqual([])
        }
      })
    })
  }

  it('has the same number of items in both languages for every template', () => {
    for (const id of TEMPLATE_IDS) {
      expect(pt.packing.templates[id].items.length).toBe(en.packing.templates[id].items.length)
    }
  })

  it('starts the beach template with sunscreen in each language', () => {
    expect(en.packing.templates.beach.items[0]).toBe('Sunscreen')
    expect(pt.packing.templates.beach.items[0]).toBe('Protetor solar')
  })

  it('uses one Portuguese name for the water bottle in beach and hiking', () => {
    const beach = en.packing.templates.beach.items.indexOf('Water bottle')
    const hiking = en.packing.templates.hiking.items.indexOf('Water bottle')
    expect(pt.packing.templates.beach.items[beach]).toBe(pt.packing.templates.hiking.items[hiking])
  })
})
