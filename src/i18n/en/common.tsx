import type { ReactNode } from 'react'
import { plural } from '../plural'

export const common = {
  /** "2 new, 1 changed" for a merge. */
  mergeSummary: ({ added, updated, removed }: { added: number; updated: number; removed: number }): string =>
    [added && `${added} new`, updated && `${updated} changed`, removed && `${removed} deleted`].filter(Boolean).join(', ') || 'small updates',
  settings: 'Settings',
  yourTrips: 'Your trips',
  nothingHere: "There's nothing here.",
  copyThis: 'Copy this:',
  copyCode: (code: string): string => `Copy ${code}`,
  supportLine: "☕ Enjoying waypoints? It's free and always will be.",
  supportOnKofi: 'Support it on Ko-fi',
  newVersionReady: 'A new version of waypoints is ready.',
  updateReady: (headline: ReactNode) => <>{headline} Reload when you've finished what you're doing.</>,
  reload: 'Reload',
  later: 'Later',
  newInWaypoints: (version: string): string => `✨ New in waypoints ${version}`,
  dismiss: 'Dismiss',
  gotIt: 'Got it',
  seeEarlier: (n: number): string => `See ${plural(n, 'earlier update')}`,
  allUpdates: 'All updates',
  whatsNew: "What's new",
}
