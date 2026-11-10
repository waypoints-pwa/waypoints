import type { ReactNode } from 'react'
import { plural } from '../plural'

export const share = {
  counts: (n: { stays: number; journeys: number; activities: number; places: number; expenses: number }): string[] => [
    plural(n.stays, 'stay'),
    plural(n.journeys, 'journey', 'journeys'),
    plural(n.activities, 'activity', 'activities'),
    plural(n.places, 'place'),
    plural(n.expenses, 'expense'),
  ],
  shareText: (who: string, tripName: string): string =>
    `${who ? `${who} shared` : 'Here’s'} “${tripName}” on waypoints. Open the link to add the trip, or to update your copy:`,
  serverNote: (onServer: string[], others: string[]): string =>
    `🌐 This trip is on the sync server, so ${onServer.join(', ')} get every change by themselves. ${
      others.length
        ? `Send this link to ${others.join(', ')}, who ${others.length === 1 ? "isn't" : "aren't"} on it.`
        : "A link is still handy for someone who isn't on the server."
    }`,
  longLink: (characters: string): string =>
    `This trip makes a long link (${characters} characters). Some chat apps cut long links short: if it doesn't open for someone, send them the file instead.`,
  intro:
    'Everyone keeps their own copy of the trip on their phone. Send this link in your group chat: opening it adds the trip, or brings an existing copy up to date. When someone else changes something, they send a link back the same way.',
  noServerInvolved: 'No server is involved: the whole trip travels inside the link.',
  mergedItemByItem:
    'Changes are merged item by item, so nothing anyone adds gets lost. If two people edit the same item, the later edit wins.',
  nameHint: 'Shown to the others as who sent it.',
  includesUnsent: (n: number): string => `Includes ${plural(n, 'change')} the others haven't seen yet.`,
  shareTripLink: '🔗 Share trip link',
  pasteIntoChat: 'Paste it into your group chat.',
  saveAsFile: '⬇️ Save as a file',
  openLinkOrFile: 'Open a trip link or file',
  anyoneWithLink: (openLinkOrFile: ReactNode) => (
    <>
      Anyone with the link or file can see everything in this trip, including expenses and notes, and a sent link can't be
      taken back. Files open with {openLinkOrFile} on the trip list.
    </>
  ),
  unsentNotice: (n: number): string => `✏️ ${plural(n, 'change')} the group hasn't seen yet.`,
  sendUpdate: 'Send update',
}
