import changelog from '../../CHANGELOG.md?raw'
import changelogPt from '../../CHANGELOG.pt.md?raw'
import { getSetting, setSetting, SETTINGS } from '../db/db'
import { parseChangelog } from '../domain/changelog'
import { language } from '../i18n'

/** Every release in CHANGELOG.md (CHANGELOG.pt.md in Portuguese), newest first (bundled, so it works offline). */
export const RELEASES = parseChangelog(language === 'pt' ? changelogPt : changelog)

/** Local to this device: each phone shows "What's new" once. */
export const getLastSeenVersion = () => getSetting<string>(SETTINGS.lastSeenVersion)
export const markReleasesSeen = () => setSetting(SETTINGS.lastSeenVersion, __APP_VERSION__)
