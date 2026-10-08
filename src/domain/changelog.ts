/*
 * Release notes, parsed from CHANGELOG.md. Shown in the app as "What's new".
 *
 * Format: one `## <x.y.z> — <YYYY-MM-DD>` heading per release, newest first, followed by
 * paragraphs and `- ` bullet lists. Inline: **bold** and `code`. Anything before the first
 * release heading is ignored.
 */

export interface Release {
  version: string
  date: string
  /** Markdown body, trimmed. */
  body: string
}

export type NotesBlock = { kind: 'list'; items: string[] } | { kind: 'paragraph'; text: string }

const HEADING = /^## (\d+\.\d+\.\d+)\s+[—–-]\s+(\d{4}-\d{2}-\d{2})\s*$/

export function parseChangelog(markdown: string): Release[] {
  const releases: Release[] = []
  let current: { version: string; date: string; lines: string[] } | undefined
  const flush = () => current && releases.push({ version: current.version, date: current.date, body: current.lines.join('\n').trim() })
  for (const line of markdown.split(/\r?\n/)) {
    const m = HEADING.exec(line)
    if (m) {
      flush()
      current = { version: m[1], date: m[2], lines: [] }
    } else if (line.startsWith('## ')) {
      throw new Error(`CHANGELOG.md: expected "## x.y.z — YYYY-MM-DD", got "${line}"`)
    } else {
      current?.lines.push(line)
    }
  }
  flush()
  return releases
}

/** Negative if a < b, positive if a > b. Plain x.y.z only. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return (pa[i] ?? 0) - (pb[i] ?? 0)
  return 0
}

export const findRelease = (releases: Release[], version: string) => releases.find((r) => r.version === version)

/** Releases after `lastSeen` up to and including `current`, newest first. */
export function unseenReleases(releases: Release[], lastSeen: string, current: string): Release[] {
  return releases
    .filter((r) => compareVersions(r.version, lastSeen) > 0 && compareVersions(r.version, current) <= 0)
    .sort((a, b) => compareVersions(b.version, a.version))
}

/** Splits a release body into paragraphs and bullet lists for rendering. */
export function parseNotes(body: string): NotesBlock[] {
  const blocks: NotesBlock[] = []
  let para: string[] = []
  const endParagraph = () => {
    if (para.length) blocks.push({ kind: 'paragraph', text: para.join(' ') })
    para = []
  }
  for (const raw of body.split('\n')) {
    const line = raw.trim()
    const bullet = /^[-*] (.*)$/.exec(line)
    if (bullet) endParagraph()
    const last = blocks.at(-1)
    if (bullet) {
      if (last?.kind === 'list') last.items.push(bullet[1])
      else blocks.push({ kind: 'list', items: [bullet[1]] })
    } else if (!line) {
      endParagraph()
    } else if (raw.startsWith('  ') && last?.kind === 'list' && !para.length) {
      // Wrapped bullet: indented continuation line.
      last.items[last.items.length - 1] += ` ${line}`
    } else {
      para.push(line)
    }
  }
  endParagraph()
  return blocks
}
