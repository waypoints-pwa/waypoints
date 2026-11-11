import type { PackingItem } from '../db/types.ts'

/*
 * Packing & to-do lists: one shared checklist per trip. Unticked items come first, then ticked ones,
 * each group in the order they were added. Templates add common items without touching the list.
 */

export const TEMPLATE_IDS = ['beach', 'city', 'hiking', 'skiing'] as const
export type TemplateId = (typeof TEMPLATE_IDS)[number]

export interface Template {
  id: TemplateId
  label: string
  items: string[]
}

/** Items that are still on the list (a deleted item is a tombstone, not on the list). */
const live = (items: PackingItem[]): PackingItem[] => items.filter((i) => !i.deletedAt)

/** Unticked first, then ticked; each group by when it was added, then text, then id (the same on every phone). */
export function sortedItems(items: PackingItem[]): PackingItem[] {
  return live(items).sort((a, b) => {
    if (Boolean(a.packed) !== Boolean(b.packed)) return a.packed ? 1 : -1
    if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1
    const ta = a.text.toLowerCase()
    const tb = b.text.toLowerCase()
    if (ta !== tb) return ta < tb ? -1 : 1
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
  })
}

/**
 * The template's items that aren't on the list yet: trimmed, compared case-insensitively, ticked items
 * count as on the list. `sameAs[k][i]` is another language's name for `template.items[i]`: an item is
 * also left out when that name is on the list. Nothing here changes existing items. The result is in
 * template order.
 */
export function newFromTemplate(existing: PackingItem[], template: { items: string[] }, sameAs: string[][] = []): string[] {
  const on = new Set(live(existing).map((i) => i.text.trim().toLowerCase()))
  const added: string[] = []
  template.items.forEach((item, i) => {
    const key = item.trim().toLowerCase()
    const others = sameAs.map((names) => names[i]).filter((n): n is string => n !== undefined)
    if (on.has(key) || others.some((n) => on.has(n.trim().toLowerCase()))) return
    on.add(key)
    added.push(item.trim())
  })
  return added
}

/** How many items are packed, out of how many there are. */
export function progress(items: PackingItem[]): { packed: number; total: number } {
  const all = live(items)
  return { packed: all.filter((i) => i.packed).length, total: all.length }
}
