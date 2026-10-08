import changelog from '../../CHANGELOG.md?raw'
import { getSetting, setSetting, SETTINGS } from '../db/db'
import { parseChangelog } from '../domain/changelog'

/** Every release in CHANGELOG.md, newest first (bundled, so it works offline). */
export const RELEASES = parseChangelog(changelog)

/** Local to this device: each phone shows "What's new" once. */
export const getLastSeenVersion = () => getSetting<string>(SETTINGS.lastSeenVersion)
export const markReleasesSeen = () => setSetting(SETTINGS.lastSeenVersion, __APP_VERSION__)
