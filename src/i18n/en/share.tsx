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
  notATripLink: "That isn't a waypoints trip link. Copy the whole link and try again.",
  couldntPaste: "Couldn't paste. Press and hold the box below and choose Paste.",
  fileCouldntBeOpened: "That file couldn't be opened.",
  linkCouldntBeOpened: "This link couldn't be opened.",
  openedTrips: (n: number, summary: string): string => `Opened ${plural(n, 'trip')}: ${summary}.`,
  openATrip: 'Open a trip',
  openIntro: 'Paste a trip link someone sent you (or an invite to a sync server), or open a waypoints file.',
  pasteTripLink: '📋 Paste trip link',
  tripLinkLabel: 'Trip link',
  openLink: 'Open link',
  openAFile: '📄 Open a file',
  sharedBy: (name: string | undefined): string => (name ? `${name} shared a trip` : 'A shared trip'),
  withPeople: (names: string): string => `With ${names}`,
  openTheTrip: 'Open the trip',
  copyUpToDate: (summary: string): string => `Your copy is up to date: ${summary}.`,
  addToMyTrips: '+ Add to my trips',
  savedOnPhone: "It's saved on this phone. Links the group sends later bring it up to date.",
  changesForCopy: (summary: ReactNode) => (
    <>
      Changes for your copy: <strong>{summary}</strong>.
    </>
  ),
  updateMyCopy: 'Update my copy',
  newestVersion: "Each item keeps its newest version, so nothing you've added is lost.",
  copyAlreadyHasAll: 'Your copy already has everything in this link.',
  isOnYourPhone: (tripName: string): string => `✓ “${tripName}” is on your phone`,
  notOnList: 'Not on the list? Add yourself',
  addMe: 'Add me',
  skipForNow: 'Skip for now',
  openInApp: 'Open in the waypoints app',
  safariKeeps:
    'Safari keeps its own copy of waypoints, separate from the app on your Home Screen. This copies the link so you can open it there.',
  copyThisLink: 'Copy this link',
  openFromHomeScreen: 'Open waypoints from your Home Screen.',
  handOffOpenTripLink: 'Open a trip link',
  tapThenPaste: (button: ReactNode) => (
    <>
      Tap {button} and then Paste.
    </>
  ),
  noWaypointsYet: 'No waypoints on your Home Screen yet? In Safari, tap Share → Add to Home Screen first.',
  useItHere: 'Use it here in Safari instead',
}
