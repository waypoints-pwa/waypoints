import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// GUIDE.pt.md is GUIDE.md in Portuguese: same sections, pictures and anchors, so neither drifts.
const root = new URL('../../', import.meta.url)
const read = (path: string) => readFileSync(new URL(path, root), 'utf8')
const en = read('GUIDE.md')
const pt = read('GUIDE.pt.md')

const slug = (heading: string) => heading.trim().toLowerCase().replace(/[^\p{L}\p{N}\p{M} _-]/gu, '').replace(/ /g, '-')
const headings = (text: string) => [...text.matchAll(/^(#{2,3}) (.+)$/gm)].map((m) => ({ level: m[1].length, title: m[2] }))
const images = (text: string) => [...text.matchAll(/<img src="([^"]+)" alt="([^"]*)"/g)].map((m) => ({ src: m[1], alt: m[2] }))
const pngs = (dir: string) => readdirSync(new URL(dir, root)).filter((f) => f.endsWith('.png')).sort()

/** The number of **bold** spans under each `##` section, by position. */
const boldBySection = (text: string) =>
  text
    .split(/^## /m)
    .slice(1)
    .map((section) => ({ title: section.split('\n')[0], bold: (section.match(/\*\*[^*]+\*\*/g) ?? []).length }))

describe('GUIDE.pt.md follows GUIDE.md', () => {
  it('has the same heading levels in the same order', () => {
    const e = headings(en)
    const p = headings(pt)
    expect(p.length, `Heading counts differ: English has ${e.length} headings, Portuguese ${p.length}`).toBe(e.length)
    e.forEach((heading, i) => {
      expect(p[i].level, `Heading ${i + 1}: "${heading.title}" vs "${p[i].title}"`).toBe(heading.level)
    })
  })

  it('has the same pictures, in Portuguese', () => {
    const e = images(en)
    const p = images(pt)
    expect(p.map((i) => i.src), 'The pictures differ from the English guide (by src, in order)').toEqual(e.map((i) => i.src.replace('docs/guide/', 'docs/guide/pt/')))
    p.forEach((img, i) => {
      expect(existsSync(new URL(img.src, root)), `Missing picture ${img.src}`).toBe(true)
      expect(img.alt, `Empty alt for ${img.src}`).not.toBe('')
      expect(img.alt, `Alt of ${img.src} is the English one`).not.toBe(e[i].alt)
    })
  })

  it('has the same screenshot names in docs/guide/pt as in docs/guide', () => {
    expect(pngs('docs/guide/pt/')).toEqual(pngs('docs/guide/'))
  })

  it('has no two pictures with the same bytes, and none equal to its English namesake', () => {
    const seen = new Map<string, string>()
    for (const name of pngs('docs/guide/pt/')) {
      const bytes = readFileSync(new URL(`docs/guide/pt/${name}`, root)).toString('base64')
      expect(bytes, `pt/${name} is the same picture as ${seen.get(bytes)}`).not.toSatisfy((b: string) => seen.has(b))
      seen.set(bytes, `pt/${name}`)
      const english = readFileSync(new URL(`docs/guide/${name}`, root)).toString('base64')
      expect(bytes, `pt/${name} is the same picture as the English one`).not.toBe(english)
    }
  })

  for (const [name, text] of [['GUIDE.md', en], ['GUIDE.pt.md', pt]] as const) {
    it(`${name}: every anchor is the slug of one of its headings`, () => {
      const slugs = new Set([...text.matchAll(/^#{1,3} (.+)$/gm)].map((m) => slug(m[1])))
      for (const [, anchor] of text.matchAll(/\]\(#([^)]+)\)/g)) {
        expect(slugs.has(anchor), `Anchor #${anchor} in ${name} matches no heading`).toBe(true)
      }
    })
  }

  it('has the same number of bold spans in each section', () => {
    const e = boldBySection(en)
    const p = boldBySection(pt)
    expect(p.length, 'The guides have a different number of ## sections').toBe(e.length)
    e.forEach((section, i) => {
      expect(p[i].bold, `Section "${p[i].title}" (English: "${section.title}") has a different number of **bold** spans`).toBe(section.bold)
    })
  })

  it('links to each other', () => {
    expect(en).toContain('](GUIDE.pt.md)')
    expect(pt).toContain('](GUIDE.md)')
  })
})
