import type { ReactNode } from 'react'
import { plural } from '../plural'

export const settings = {
  title: 'Settings',
  safetyName: {
    removing: (name: string): string => `Before removing “${name}”`,
    importing: 'Before importing a file',
    connecting: 'Before connecting to the sync server',
    updatingFromLink: (name: string): string => `Before updating “${name}” from a link`,
  },
  backupDownloaded: 'Backup downloaded.',
  imported: (trips: number, summary: string): string => `Imported ${plural(trips, 'trip')}: ${summary}.`,
  importFailed: 'Import failed.',

  yourName: 'Your name',
  nameHint: 'Suggested as the first traveller on new trips. It stays on this phone.',
  language: 'Language',
  languageAutomatic: "Automatic (phone's language)",
  languageHint: 'Changing it reloads the app. Only for this phone.',

  addressSearch: 'Address search',
  addressSearchText:
    "Cities and airports come with the app, so searching for them works offline. Addresses don't: there are far too many. Address fields suggest the ones already in the trip, such as your stay's for an activity there.",
  searchOnline: 'Also search for addresses online',
  searchOnlineHint:
    'What you type in an address field goes to Photon, a free OpenStreetMap search run by komoot (Germany), with no account. It needs internet. Only for this phone.',

  syncServer: 'Sync server',
  connectedAs: (name: ReactNode, host: string, disconnected: boolean) => (
    <>
      🌐 Connected as {name} to {host}
      {disconnected ? ', but this phone was disconnected.' : '.'}
    </>
  ),
  serverOptional: 'Optional. With a waypoints server, trips you put on it reach the others on it by themselves, without sending links.',
  serverSettings: 'Server settings',
  connectToServer: 'Connect to a server',

  backupTransfer: 'Backup & transfer',
  backupText:
    'Your trips are stored on this phone. Export a backup file to keep them safe or to move them to another phone, then import it there. Importing merges: each item keeps its newest version, so importing a file twice changes nothing.',
  backupFilesText:
    "Photos and documents would make backup files huge, so they aren't in them (only their names and captions). Those on a sync server come back from it.",
  exportAll: '⬇️ Export all trips',
  importFile: '⬆️ Import a file',
  safetyCopies: (n: number): string => `Safety copies (${n})`,
  safetyCopiesText: "Kept automatically before removing a trip or overwriting it with someone's changes. Download one and import it to get things back.",
  download: 'Download',

  storage: 'Storage',
  storageUsed: (size: string): string => `waypoints uses ${size} on this phone, photos and documents included.`,
  storagePersistent: "✅ Storage is persistent: the browser won't clear your trips to free up space.",
  storageMayClear:
    'The browser may clear site data when space runs low (especially on iPhone). Adding waypoints to your Home Screen and allowing persistent storage makes this much less likely, but keep a backup anyway.',
  requestPersistent: 'Request persistent storage',

  updates: 'Updates',
  updatesText: 'waypoints updates itself. See what changed in each version.',
  whatsNew: "✨ What's new",

  about: 'About',
  aboutVersion: (version: string, github: ReactNode) => <>waypoints v{version} · open source · {github}</>,
  howToUse: 'How to use waypoints',
  aboutGuide: (guide: ReactNode) => <>📖 {guide}</>,
  privacyText:
    'No account, no tracking, no ads. Your trips stay on this phone and only leave it in the links and files you choose to send, and for the trips you put on a sync server, if you connect to one. Maps and calendars open in their own apps; without a server, waypoints itself never connects to anything, unless you turn on online address search.',
  dataCredits: (geonames: ReactNode, ourAirports: ReactNode, mwgg: ReactNode) => (
    <>
      City and time zone data from {geonames} (CC BY 4.0); airports from {ourAirports} and {mwgg}.
    </>
  ),
}
