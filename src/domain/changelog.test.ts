/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { compareVersions, findRelease, parseChangelog, parseNotes, unseenReleases } from './changelog'

const sample = `# Changelog

Intro text that isn't a release.

## 1.2.0 — 2026-10-01

- **Bold** thing
- Wrapped bullet
  continues here

## 1.10.0 - 2026-11-01

Just a paragraph.
`

describe('parseChangelog', () => {
  it('splits releases and ignores the intro', () => {
    const releases = parseChangelog(sample)
    expect(releases.map((r) => [r.version, r.date])).toEqual([
      ['1.2.0', '2026-10-01'],
      ['1.10.0', '2026-11-01'],
    ])
    expect(releases[0].body).toBe('- **Bold** thing\n- Wrapped bullet\n  continues here')
    expect(releases[1].body).toBe('Just a paragraph.')
  })

  it('rejects malformed release headings', () => {
    expect(() => parseChangelog('## v1.0 (soon)\n- x')).toThrow(/expected/)
  })
})

describe('compareVersions', () => {
  it('compares numerically', () => {
    expect(compareVersions('1.10.0', '1.9.9')).toBeGreaterThan(0)
    expect(compareVersions('0.3.1', '0.4.0')).toBeLessThan(0)
    expect(compareVersions('2.0.0', '2.0.0')).toBe(0)
  })
})

describe('unseenReleases', () => {
  const releases = ['0.5.0', '0.4.0', '0.3.1', '0.3.0'].map((version) => ({ version, date: '2026-10-01', body: 'x' }))

  it('returns releases after the last seen one, up to the running version', () => {
    expect(unseenReleases(releases, '0.3.0', '0.4.0').map((r) => r.version)).toEqual(['0.4.0', '0.3.1'])
  })

  it('returns nothing when up to date or downgraded', () => {
    expect(unseenReleases(releases, '0.5.0', '0.5.0')).toEqual([])
    expect(unseenReleases(releases, '0.5.0', '0.4.0')).toEqual([])
  })
})

describe('parseNotes', () => {
  it('groups bullets, joins wrapped lines and keeps paragraphs', () => {
    expect(parseNotes('Intro line\nstill intro\n\n- one\n- two\n  wrapped\n\nOutro')).toEqual([
      { kind: 'paragraph', text: 'Intro line still intro' },
      { kind: 'list', items: ['one', 'two wrapped'] },
      { kind: 'paragraph', text: 'Outro' },
    ])
  })

  it('starts a new list after a paragraph', () => {
    expect(parseNotes('- a\n\nMiddle\n- b')).toEqual([
      { kind: 'list', items: ['a'] },
      { kind: 'paragraph', text: 'Middle' },
      { kind: 'list', items: ['b'] },
    ])
  })
})


// The "What's new" card comes from CHANGELOG.md: a version bump without an entry would deploy
// silently, so CI fails instead.
describe('CHANGELOG.md', () => {
  const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
  const releases = parseChangelog(read('../../CHANGELOG.md'))
  const { version } = JSON.parse(read('../../package.json')) as { version: string }

  it('has an entry for the version in package.json', () => {
    expect(findRelease(releases, version), `Add "## ${version} — YYYY-MM-DD" to CHANGELOG.md`).toBeDefined()
  })

  it('lists unique versions, newest first, each with notes', () => {
    const versions = releases.map((r) => r.version)
    expect(versions).toEqual([...versions].sort((a, b) => compareVersions(b, a)))
    expect(new Set(versions).size).toBe(versions.length)
    for (const r of releases) expect(r.body, r.version).not.toBe('')
  })
})
