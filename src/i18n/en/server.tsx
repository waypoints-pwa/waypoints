import { plural } from '../plural'

export const server = {
  disconnected: 'This phone was disconnected from the sync server. Your trips are still here.',
  serverSettings: 'Sync server settings',
  couldntSync: (ago: string | undefined, reason: string): string => `Couldn't sync${ago ? ` (last time ${ago})` : ''}: ${reason}`,
  savedWillGoUp: (n: number): string => `${plural(n, 'change')} saved here will go up once the server can be reached.`,
  synced: (ago: string): string => `✅ Synced ${ago}`,
  waitingFirstSync: 'Waiting for the first sync…',
  toSend: (n: number): string => `${plural(n, 'change')} to send`,
  refused: (n: number, reason: string): string =>
    `The server refused ${plural(n, 'change')}: ${reason} They stay on this phone and are sent again at each sync, so updating the server may fix it.`,
  syncing: 'Syncing…',
  syncNow: '🔄 Sync now',
  noLongerOnTrip:
    "You're no longer on this trip on the sync server: someone took you off it, or you were removed from the server. Your copy stays on this phone, and links still bring you the group's changes.",
  tripIsOnServer: (name: string): string => `🌐 “${name}” is on the server.`,
  backToTrip: 'Back to the trip',
  connectFirst: 'Connect this phone to a sync server first.',
  putTripOnServer: (name: string): string => `Put “${name}” on the server`,
  moveIntro:
    'Say who each traveller is on the server. They get the trip, and every change after it, by themselves. Anyone not on the server keeps getting links, and links already sent keep working.',
  whosWho: "Who's who",
  chooseWhichYouAre: 'Choose which traveller you are: the server only shows the trip to the people on it.',
  moveNote:
    "Only the people linked here can see the trip on the server. If the server can't be reached right now, the trip goes up the next time it can.",
  moveFilesNote: 'Its photos and documents go up too, and the others on the server see them. Those marked “only on this phone” stay here.',
}
